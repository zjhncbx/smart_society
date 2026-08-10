import 'package:dio/dio.dart';

/// 网络错误码
class ApiException implements Exception {
  ApiException(this.code, this.message);

  final int code;
  final String message;

  @override
  String toString() => message;
}

/// 统一网络客户端：Dio 单例 + 请求/错误拦截器。
///
/// MVP 阶段业务数据走本地 Hive，此客户端预留为后端联调使用，
/// baseUrl 通过 [ApiClient.instance.baseUrl] 配置。
class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  static const int codeSuccess = 0;
  static const int codeNetworkError = -1;
  static const int codeServerError = -2;
  static const int codeTimeout = -3;

  String baseUrl = 'https://api.smartsociety.example.com';

  late final Dio dio;

  void init() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        contentType: Headers.jsonContentType,
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          debugLog('→ ${options.method} ${options.uri}');
          handler.next(options);
        },
        onResponse: (response, handler) {
          debugLog('← ${response.statusCode} ${response.requestOptions.uri}');
          handler.next(response);
        },
        onError: (error, handler) {
          debugLog('✗ ${error.type} ${error.requestOptions.uri}');
          handler.next(error);
        },
      ),
    );
  }

  /// GET 请求，返回统一结构 `{code, message, data}`。
  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      final resp = await dio.get<Map<String, dynamic>>(
        path,
        queryParameters: query,
      );
      return _handle(resp);
    } on DioException catch (e) {
      throw _toApiException(e);
    }
  }

  /// POST 请求，返回统一结构 `{code, message, data}`。
  Future<Map<String, dynamic>> post(
    String path, {
    Object? data,
  }) async {
    try {
      final resp = await dio.post<Map<String, dynamic>>(path, data: data);
      return _handle(resp);
    } on DioException catch (e) {
      throw _toApiException(e);
    }
  }

  Map<String, dynamic> _handle(Response<Map<String, dynamic>> resp) {
    final body = resp.data;
    if (body == null) {
      throw ApiException(codeServerError, '服务器返回为空');
    }
    final code = (body['code'] as num?)?.toInt() ?? codeServerError;
    if (code != codeSuccess) {
      throw ApiException(code, (body['message'] as String?) ?? '请求失败');
    }
    return body;
  }

  ApiException _toApiException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return ApiException(codeTimeout, '网络请求超时，请稍后重试');
      case DioExceptionType.connectionError:
        return ApiException(codeNetworkError, '网络连接失败，请检查网络');
      case DioExceptionType.badResponse:
        return ApiException(
          codeServerError,
          '服务器错误（${e.response?.statusCode}）',
        );
      default:
        return ApiException(codeNetworkError, '网络异常，请稍后重试');
    }
  }
}

/// 打印请求日志（debug 模式）
void debugLog(String message) {
  // ignore: avoid_print
  print('[Api] $message');
}
