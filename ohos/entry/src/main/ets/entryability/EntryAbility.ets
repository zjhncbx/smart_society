
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { cloudCommon, cloudFunction } from '@kit.CloudFoundationKit';
import {
  FlutterAbility,
  FlutterEngine,
  MethodCall,
  MethodCallHandler,
  MethodChannel,
  MethodResult,
} from '@ohos/flutter_ohos';
import { GeneratedPluginRegistrant } from '../plugins/GeneratedPluginRegistrant';

export default class EntryAbility extends FlutterAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    super.onCreate(want, launchParam)
    // 云函数免鉴权，无需 authProvider；云数据库/云存储需通过云函数访问
    cloudCommon.init({
      region: cloudCommon.CloudRegion.CHINA,
      functionOptions: { timeout: 10 * 1000 },
    })
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
        if (call.method === 'callFunction') {
          const name = call.argument('name') as string
          const data = call.argument('data') as Object | null
          const timeout = call.argument('timeout') as number | null
          const functionParams: cloudFunction.FunctionParams = {
            name: name,
            timeout: timeout ?? 10000,
          }
          if (data != null) {
            functionParams.data = data
          }
          cloudFunction.call(functionParams)
            .then((res) => {
              result.success(JSON.stringify(res.result))
            })
            .catch((err: BusinessError) => {
              result.error(String(err.code), err.message, null)
            })
        } else {
          result.notImplemented()
        }
      },
    }
    channel.setMethodCallHandler(handler)
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
