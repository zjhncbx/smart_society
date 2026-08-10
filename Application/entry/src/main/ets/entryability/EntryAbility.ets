
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { cloudCommon, cloudFunction } from '@kit.CloudFoundationKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { authentication } from '@kit.AccountKit';
import {
  FlutterAbility,
  FlutterEngine,
  MethodCall,
  MethodCallHandler,
  MethodChannel,
  MethodResult,
} from '@ohos/flutter_ohos';
import { GeneratedPluginRegistrant } from '../plugins/GeneratedPluginRegistrant';

const CLOUD_TAG = 'CloudChannel';
const AUTH_TAG = 'AuthChannel';

export default class EntryAbility extends FlutterAbility {
  private authController: authentication.AuthenticationController | null = null;

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    super.onCreate(want, launchParam)
    // 云函数免鉴权，无需 authProvider；云数据库/云存储需通过云函数访问
    cloudCommon.init({
      region: cloudCommon.CloudRegion.CHINA,
      functionOptions: { timeout: 10 * 1000 },
    })
    hilog.info(0x0000, CLOUD_TAG, 'cloud kit init called')
  }

  configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    GeneratedPluginRegistrant.registerWith(flutterEngine)
    this.registerStorageChannel(flutterEngine)
    this.registerCloudChannel(flutterEngine)
    this.registerAuthChannel(flutterEngine)
  }

  private registerCloudChannel(flutterEngine: FlutterEngine) {
    const channel = new MethodChannel(
      flutterEngine.dartExecutor.getBinaryMessenger(),
      'com.smartsociety/cloud',
    )
    const handler: MethodCallHandler = {
      onMethodCall: (call: MethodCall, result: MethodResult): void => {
        hilog.info(0x0000, CLOUD_TAG, 'method received: %{public}s', call.method)
        if (call.method === 'ping') {
          result.success('pong')
          return
        }
        if (call.method !== 'callFunction') {
          result.notImplemented()
          return
        }
        let replied = false
        const replyOnce = (fn: () => void): void => {
          if (replied) return
          replied = true
          fn()
        }
        let name = ''
        try {
          name = call.argument('name') as string
          const data = call.argument('data') as Object | null
          const timeout = call.argument('timeout') as number | null
          const functionParams: cloudFunction.FunctionParams = {
            name: name,
            timeout: timeout ?? 8000,
          }
          if (data != null) {
            functionParams.data = data
          }
          // 看门狗：云函数调用超过 20s 未返回时强制回错误，避免端侧无限转圈
          const watchdog = setTimeout(() => {
            replyOnce(() => {
              hilog.error(0x0000, CLOUD_TAG, 'watchdog timeout for %{public}s', name)
              result.error('CLOUD_TIMEOUT', 'cloud function call timed out', null)
            })
          }, 20 * 1000)
          hilog.info(0x0000, CLOUD_TAG, 'calling function %{public}s', name)
          cloudFunction.call(functionParams)
            .then((res) => {
              hilog.info(0x0000, CLOUD_TAG, 'function %{public}s resolved', name)
              let body = ''
              try {
                body = JSON.stringify(res.result)
              } catch (_e) {
                body = String(res.result)
              }
              replyOnce(() => {
                clearTimeout(watchdog)
                result.success(body)
              })
            })
            .catch((err: BusinessError) => {
              hilog.error(0x0000, CLOUD_TAG, 'function %{public}s rejected: code=%{public}d msg=%{public}s', name, err.code, err.message)
              replyOnce(() => {
                clearTimeout(watchdog)
                result.error(String(err.code), err.message, null)
              })
            })
        } catch (e) {
          hilog.error(0x0000, CLOUD_TAG, 'handler exception for %{public}s: %{public}s', name, JSON.stringify(e))
          replyOnce(() => {
            result.error('HANDLER_ERROR', JSON.stringify(e), null)
          })
        }
      },
    }
    channel.setMethodCallHandler(handler)
    hilog.info(0x0000, CLOUD_TAG, 'cloud channel registered')
  }

  private registerStorageChannel(flutterEngine: FlutterEngine) {
    const channel = new MethodChannel(
      flutterEngine.dartExecutor.getBinaryMessenger(),
      'com.smartsociety/storage',
    )
    const handler: MethodCallHandler = {
      onMethodCall: (call: MethodCall, result: MethodResult): void => {
        if (call.method === 'getStoragePath') {
          result.success(this.context.filesDir)
        } else {
          result.notImplemented()
        }
      },
    }
    channel.setMethodCallHandler(handler)
  }

  private registerAuthChannel(flutterEngine: FlutterEngine) {
    const channel = new MethodChannel(
      flutterEngine.dartExecutor.getBinaryMessenger(),
      'com.smartsociety/auth',
    )
    const handler: MethodCallHandler = {
      onMethodCall: (call: MethodCall, result: MethodResult): void => {
        if (call.method === 'signIn') {
          this.handleSignIn(result)
        } else if (call.method === 'signOut') {
          this.handleSignOut(result)
        } else if (call.method === 'getUserInfo') {
          this.handleGetUserInfo(result)
        } else {
          result.notImplemented()
        }
      },
    }
    channel.setMethodCallHandler(handler)
    hilog.info(0x0000, AUTH_TAG, 'auth channel registered')
  }

  private handleSignIn(result: MethodResult) {
    try {
      const provider = new authentication.HuaweiIDProvider()
      const request = provider.createLoginWithHuaweiIDRequest()
      this.authController = new authentication.AuthenticationController(this.context)
      this.authController.executeRequest(request).then((res: authentication.AuthenticationResponse) => {
        const loginResponse = res as authentication.LoginWithHuaweiIDResponse
        const credential = loginResponse?.data
        if (!credential) {
          result.error('AUTH_FAILED', 'login returned no credential', null)
          return
        }
        hilog.info(0x0000, AUTH_TAG, 'signIn success: openId=%{public}s', credential.openID ?? '')
        this.fetchUserProfile(credential.openID ?? '', result)
      }).catch((err: BusinessError) => {
        hilog.error(0x0000, AUTH_TAG, 'signIn failed: code=%{public}d msg=%{public}s', err.code, err.message)
        result.error(String(err.code), err.message, null)
      })
    } catch (e) {
      hilog.error(0x0000, AUTH_TAG, 'signIn exception: %{public}s', JSON.stringify(e))
      result.error('AUTH_ERROR', JSON.stringify(e), null)
    }
  }

  // 授权获取用户昵称/头像（scopes=profile）；失败时降级为仅返回 openId
  private fetchUserProfile(openId: string, result: MethodResult) {
    if (!this.authController) {
      result.success(JSON.stringify({ 'openId': openId }))
      return
    }
    try {
      const provider = new authentication.HuaweiIDProvider()
      const authRequest = provider.createAuthorizationWithHuaweiIDRequest()
      authRequest.scopes = ['profile']
      this.authController.executeRequest(authRequest).then((res: authentication.AuthenticationResponse) => {
        const authResponse = res as authentication.AuthorizationWithHuaweiIDResponse
        const credential = authResponse?.data
        const userInfo: Record<string, string> = { 'openId': openId }
        if (credential?.unionID) userInfo['unionId'] = credential.unionID
        if (credential?.nickName) userInfo['displayName'] = credential.nickName
        if (credential?.avatarUri) userInfo['avatarUri'] = credential.avatarUri
        result.success(JSON.stringify(userInfo))
      }).catch((err: BusinessError) => {
        hilog.warn(0x0000, AUTH_TAG, 'fetchUserProfile failed: code=%{public}d msg=%{public}s', err.code, err.message)
        result.success(JSON.stringify({ 'openId': openId }))
      })
    } catch (e) {
      hilog.warn(0x0000, AUTH_TAG, 'fetchUserProfile exception: %{public}s', JSON.stringify(e))
      result.success(JSON.stringify({ 'openId': openId }))
    }
  }

  private handleSignOut(result: MethodResult) {
    try {
      if (this.authController) {
        const provider = new authentication.HuaweiIDProvider()
        const request = provider.createCancelAuthorizationRequest()
        this.authController.executeRequest(request).then(() => {
          hilog.info(0x0000, AUTH_TAG, 'signOut success')
          this.authController = null
          result.success(true)
        }).catch((err: BusinessError) => {
          hilog.error(0x0000, AUTH_TAG, 'signOut failed: code=%{public}d msg=%{public}s', err.code, err.message)
          result.error(String(err.code), err.message, null)
        })
      } else {
        result.success(true)
      }
    } catch (e) {
      hilog.error(0x0000, AUTH_TAG, 'signOut exception: %{public}s', JSON.stringify(e))
      result.error('AUTH_ERROR', JSON.stringify(e), null)
    }
  }

  private handleGetUserInfo(result: MethodResult) {
    result.notImplemented()
  }
}
