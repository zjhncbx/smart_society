
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { buffer } from '@kit.ArkTS';
import { cloudCommon, cloudFunction } from '@kit.CloudFoundationKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import auth from '@hw-agconnect/auth';
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
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    super.onCreate(want, launchParam)
    // 初始化 AGC 认证服务 SDK，需在登录前完成
    try {
      const file = this.context.resourceManager.getRawFileContentSync('agconnect-services.json')
      const json: string = buffer.from(file.buffer).toString()
      auth.init(this.context, json)
      hilog.info(0x0000, AUTH_TAG, 'agc auth init success')
    } catch (e) {
      hilog.error(0x0000, AUTH_TAG, 'agc auth init failed: %{public}s', JSON.stringify(e))
    }
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
            // MethodChannel 解码的 Map 经 JSON.stringify 会变成 {}，需转成普通对象
            let payload: Object = data
            if (typeof data === 'string') {
              payload = data
            } else if (data instanceof Map) {
              const obj: Record<string, Object> = {}
              data.forEach((v: Object, k: string) => {
                obj[k] = v
              })
              payload = obj
            }
            functionParams.data = payload
            hilog.info(0x0000, CLOUD_TAG, 'callFunction %{public}s data=%{public}s', name, JSON.stringify(payload))
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
    hilog.info(0x0000, AUTH_TAG, 'signIn: calling AGC auth signIn with hwid')
    auth.signIn({
      autoCreateUser: true,
      credentialInfo: { kind: 'hwid' },
    }).then((signInResult) => {
      const user = signInResult.getUser()
      const uid = user.getUid()
      const displayName = user.getDisplayName()
      const photoUrl = user.getPhotoUrl()
      hilog.info(0x0000, AUTH_TAG, 'signIn success: uid=%{public}s displayName=%{public}s', uid, displayName)
      const userInfo: Record<string, string> = { 'openId': uid }
      if (displayName) userInfo['displayName'] = displayName
      if (photoUrl) userInfo['avatarUri'] = photoUrl
      result.success(JSON.stringify(userInfo))
    }).catch((err: BusinessError) => {
      hilog.error(0x0000, AUTH_TAG, 'signIn failed: code=%{public}d msg=%{public}s', err.code, err.message)
      result.error(String(err.code), err.message, null)
    })
  }

  private handleSignOut(result: MethodResult) {
    hilog.info(0x0000, AUTH_TAG, 'signOut: calling AGC auth signOut')
    auth.signOut().then(() => {
      hilog.info(0x0000, AUTH_TAG, 'signOut success')
      result.success(true)
    }).catch((err: BusinessError) => {
      hilog.error(0x0000, AUTH_TAG, 'signOut failed: code=%{public}d msg=%{public}s', err.code, err.message)
      result.error(String(err.code), err.message, null)
    })
  }

  private handleGetUserInfo(result: MethodResult) {
    auth.getCurrentUser().then((user) => {
      if (user == null) {
        hilog.info(0x0000, AUTH_TAG, 'getUserInfo: no user logged in')
        result.error('NOT_LOGGED_IN', 'no user logged in', null)
        return
      }
      const uid = user.getUid()
      const displayName = user.getDisplayName()
      const photoUrl = user.getPhotoUrl()
      hilog.info(0x0000, AUTH_TAG, 'getUserInfo success: uid=%{public}s', uid)
      const userInfo: Record<string, string> = { 'openId': uid }
      if (displayName) userInfo['displayName'] = displayName
      if (photoUrl) userInfo['avatarUri'] = photoUrl
      result.success(JSON.stringify(userInfo))
    }).catch((err: BusinessError) => {
      hilog.error(0x0000, AUTH_TAG, 'getUserInfo failed: code=%{public}d msg=%{public}s', err.code, err.message)
      result.error(String(err.code), err.message, null)
    })
  }
}
