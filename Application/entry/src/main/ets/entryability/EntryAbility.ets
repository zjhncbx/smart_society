
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { cloudCommon, cloudFunction } from '@kit.CloudFoundationKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
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

export default class EntryAbility extends FlutterAbility {
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
}
