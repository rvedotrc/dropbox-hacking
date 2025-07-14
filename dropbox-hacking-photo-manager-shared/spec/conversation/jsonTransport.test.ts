import { deepStrictEqual } from "node:assert";
import { it, suite } from "node:test";

import type { JSONValue } from "@blaahaj/json";

import {
  type Receiver,
  type Sender,
  transportAsJson,
} from "../../src/index.js";

const createHarness = () => {
  const stringsSent: (string | undefined)[] = [];
  const stringSender: Sender<string> = {
    send: (message) => stringsSent.push(message),
    close: () => stringsSent.push(undefined),
    inspect: () => ``,
  };

  const objectsReceived: (JSONValue | undefined)[] = [];
  const objectReceiver: Receiver<JSONValue> = {
    receive: (message) => objectsReceived.push(message),
    close: () => objectsReceived.push(undefined),
    inspect: () => ``,
  };

  let stringReceiver: Receiver<string> =
    undefined as unknown as Receiver<string>;
  const objectSender = transportAsJson({
    connect: (r) => {
      stringReceiver = r;
      return stringSender;
    },
    inspect: () => ``,
  }).connect(objectReceiver);

  return {
    stringReceiver,
    objectSender,
    stringsSent,
    objectsReceived,
  };
};

void suite("jsonTransport", () => {
  void it("encodes before sending", () => {
    const harness = createHarness();
    harness.objectSender.send([1, "two", { foo: true }, null]);
    deepStrictEqual(harness.stringsSent, ['[1,"two",{"foo":true},null]']);
  });

  void it("passes on sender-close", () => {
    const harness = createHarness();
    harness.objectSender.close();
    deepStrictEqual(harness.stringsSent, [undefined]);
  });

  void it("decodes after receiving", () => {
    const harness = createHarness();
    harness.stringReceiver.receive('[1,"two",{"foo":true},null]');
    deepStrictEqual(harness.objectsReceived, [[1, "two", { foo: true }, null]]);
  });

  void it("passes on receiver-close", () => {
    const harness = createHarness();
    harness.stringReceiver.close();
    deepStrictEqual(harness.objectsReceived, [undefined]);
  });
});
