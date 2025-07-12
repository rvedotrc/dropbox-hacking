import { deepStrictEqual } from "node:assert";
import { it, suite } from "node:test";

import type { JSONValue } from "@blaahaj/json";

import {
  type Incoming,
  type Outgoing,
  transportAsJson,
} from "../../src/index.js";

const createHarness = () => {
  const stringsSent: (string | undefined)[] = [];
  const stringSender: Outgoing<string> = {
    send: (message) => stringsSent.push(message),
    close: () => stringsSent.push(undefined),
  };

  const objectsReceived: (JSONValue | undefined)[] = [];
  const objectReceiver: Incoming<JSONValue> = {
    receive: (message) => objectsReceived.push(message),
    close: () => objectsReceived.push(undefined),
  };

  let stringReceiver: Incoming<string> =
    undefined as unknown as Incoming<string>;
  const objectSender = transportAsJson((r) => {
    stringReceiver = r;
    return stringSender;
  })(objectReceiver);

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
