import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch';
let pendingTask = null;

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  if (!pendingTask) return BackgroundFetch.Result.NoData;

  try {
    const { service, message } = pendingTask;
    const response = await service.sendMessage(message);
    
    const modelName = service.constructor.name.replace('Service', '');
    console.log(`${modelName} completed task in background`);

    pendingTask = null;
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    pendingTask = null;
    return BackgroundFetch.Result.Failed;
  }
});

class BackgroundTaskManager {
  async init() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 1,
        stopOnTerminate: false
      });
    } catch (err) {
      if (err.message !== 'Task is already registered') {
        console.warn('Task registration failed:', err);
      }
    }
  }

  async startTask(service, message) {
    pendingTask = { service, message };
    return BackgroundFetch.startTaskAsync(BACKGROUND_FETCH_TASK);
  }
}

export default new BackgroundTaskManager(); 