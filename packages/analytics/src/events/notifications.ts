import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const notificationActionClickedProperties = z.object({
  notificationType: z.string().max(64),
}).strict();

export const notificationsEvents: AnalyticsEventDefinition[] = [
  { name: "notification_action_clicked", schema: notificationActionClickedProperties, critical: false, version: 1 },
];
