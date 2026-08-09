
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
  configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    GeneratedPluginRegistrant.registerWith(flutterEngine)
    this.registerStorageChannel(flutterEngine)
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
