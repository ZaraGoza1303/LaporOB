import z from "zod";

export const NotificationIdSchema = z.object({
  notification_id: z.string().trim().uuid({ message: "Format laporan_id harus UUID yang valid" }),
});
