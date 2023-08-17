import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_TOPIC,
  KAFKA_ACTIVITY_PROFILE_TOPIC,
  KAFKA_NOTIFICATION_TOPIC,
  KAFKA_ANALYTIC_TOPIC,
} from "env";
import { Kafka, Partitioners, Producer, logLevel } from "kafkajs";
import { logger } from "logger";

export default {
  queue: null,
  init: function () {
    this.queue = new Queue();
  },
} as { queue: Queue | null; init: () => void };

class Queue {
  private producer: Producer;
  private kafka: Kafka;
  private topic = KAFKA_TOPIC;
  private analyticTopic = KAFKA_ANALYTIC_TOPIC;
  private activityProfileTopic = KAFKA_ACTIVITY_PROFILE_TOPIC;
  private notificationTopic = KAFKA_NOTIFICATION_TOPIC;

  constructor() {
    this.kafka = new Kafka({
      brokers: KAFKA_BROKERS.split(","),
      clientId: KAFKA_CLIENT_ID,
      retry: {
        retries: 3,
      },
      logCreator: (level) => {
        return function ({ log }) {
          const { message } = log;
          switch (level) {
            case logLevel.ERROR:
              logger.error(message);
              break;
            case logLevel.INFO:
              logger.info(message);
              break;
            case logLevel.WARN:
              logger.warn(message);
              break;
            case logLevel.DEBUG:
              logger.debug(message);
              break;
            case logLevel.NOTHING:
            default:
              break;
          }
        };
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
    });

    this.connect();
  }

  async connect() {
    try {
      logger.info("Connecting to Kafka...");
      await this.producer.connect();
      logger.info("Connect to Kafka OK");
    } catch (e: any) {
      logger.error(e);
      logger.warn("Connect to Kafka FAIL");
    }
  }

  async disconnect() {
    try {
      logger.info("Disconnecting from Kafka...");
      await this.producer.disconnect();
      logger.info("Disconnect from Kafka OK");
    } catch (e: any) {
      logger.error(e);
      logger.warn("Disconnect from Kafka FAIL");
    }
  }

  private stringify(messages: any[]) {
    try {
      return messages.map((msg) =>
        JSON.stringify(msg, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      );
    } catch (_) {
      throw new Error("Message is not valid json");
    }
  }

  // don't use stringify logic in this method
  async produceAnalyticMsg(messages: any[]) {
    await this.producer
      .send({
        topic: this.analyticTopic,
        messages: messages.map((m) => {
          const data = JSON.stringify(m);
          const bytes = new TextEncoder().encode(data);
          const binaryString = Array.from(bytes, (x) =>
            String.fromCodePoint(x)
          ).join("");

          return {
            value: JSON.stringify({
              type: "audit",
              sender: "mochi-telegram",
              message: btoa(binaryString),
            }),
          };
        }),
      })
      .catch(() => logger.warn("Cannot send analytics msg"));
  }

  async produceBatch(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    );

    await this.producer
      .send({
        topic: this.topic,
        messages: stringified.map((m) => ({ value: m })),
      })
      .catch(() => logger.warn("Cannot send batch msg"));
  }

  async produceActivityMsg(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    );

    await this.producer
      .send({
        topic: this.activityProfileTopic,
        messages: stringified.map((m) => ({ value: m })),
      })
      .catch(() => logger.warn("Cannot send activity msg"));
  }

  async produceNotificationMsg(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    );

    await this.producer
      .send({
        topic: this.notificationTopic,
        messages: stringified.map((m) => ({ value: m })),
      })
      .catch(() => logger.warn("Cannot send notification msg"));
  }
}
