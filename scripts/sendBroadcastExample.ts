// scripts/sendBroadcastExample.ts
import { sendPush } from "../src/lib/notifications/sendPush";

(async () => {
  const tokens = ["ExpoPushToken[example]"];
  const payload = { title: "Test broadcast", body: "This is a test message from local script" };
  console.log(await sendPush(tokens, payload));
})();
