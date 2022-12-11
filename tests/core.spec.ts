import {
  $,
  $$,
  after,
  anchorRef,
  appendChild,
  attr,
  before,
  bindAttr,
  bindEvent,
  bindText,
  clone,
  docFragment,
  element,
  insertSlot,
  moveRange,
  remove,
  select,
  seqAfter,
  text,
} from "../dist/core";
import { source } from "../dist/store";

describe("core.ts", () => {
  describe("element", () => {
    it("should create HTML element", () => {
      const node = element("div");
      expect(node).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("docFragment", () => {
    it("should create document fragment", () => {
      expect(docFragment()).toBeInstanceOf(DocumentFragment);
    });
  });

  describe("clone", () => {
    it("should clone DOM node deeply", () => {
      const node = element("div");
      node.innerHTML = `<p>test1</p><p>test2</p>`;
      const cloneNode = clone(node);
      expect(cloneNode.innerHTML).toBe(node.innerHTML);
    });
  });

  describe("attr", () => {
    it("should set element attribute", () => {
      const node = document.createElement("div");
      attr(node, "id", "test");
      expect(node.id).toBe("test");
      attr(node, "id", null);
      expect(node.id).toBeFalsy();
      attr(node, "id", "test");
      expect(node.id).toBe("test");
      attr(node, "id", false);
      expect(node.id).toBeFalsy();
    });
  });

  describe("select", () => {
    it("should select element in DOM subtree by CSS selector", () => {
      const container = document.createElement("div");
      const button = document.createElement("button");
      button.id = "foo";
      appendChild(container)(button);
      const currentElement = select(container, "button#foo");
      expect(currentElement).toBe(button);
    });

    it("should select DOM element from documnet", () => {
      const node = document.createElement("div");
      document.body.appendChild(node);
      const currentElement = select("div");
      expect(currentElement).toBe(node);
    });
  });

  describe("anchorRef", () => {
    beforeAll(() => {
      document.body.innerHTML = `<template #t1>
            <div #t></div>
          </template>
          <div id="parent">
            <div id="child" #child></div>
          </div>`;
    });

    it("it should get HTMLTemplateElement with a single string argument", () => {
      const anchorReferenced = anchorRef("t1");
      const template1 = document.querySelector(`template[\\#t1]`);
      expect(anchorReferenced).toBe(template1);
    });

    it("it should get child element", () => {
      const parentNode = document.getElementById("parent")!;
      const childAnchorReferenced = anchorRef(parentNode, "child");
      const childElement = document.getElementById("child");
      expect(childAnchorReferenced).toBe(childElement);
    });
  });

  describe("$", () => {
    it("should be alias of `anchorRef`", () => {
      expect($).toBe(anchorRef);
    });
  });

  describe("$$", () => {
    it("should perform `querySelectorAll`", () => {
      const node = element("div");
      const list = [];
      for (let i = 0; i < 10; i++) {
        const p = element("p");
        list.push(p);
        appendChild(node)(p);
      }
      expect($$(node, "p")).toStrictEqual(list);
    });
  });

  describe("bindText", () => {
    it("should bind textContent", () => {
      const data = source("1");
      const p = element("p");
      bindText(p, data);
      expect(p.textContent).toBe("1");
      data.set("2");
      expect(p.textContent).toBe("2");
    });
  });

  describe("text", () => {
    it("should bind textContent with reactive store", () => {
      const p = document.createElement("p");
      const a1 = source(1);
      const fn = text`print: ${a1}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      a1.set(2);
      expect(p.textContent).toBe("print: 2");
      fn();
    });

    it("should insert text with primitive values", () => {
      const p = document.createElement("p");
      const content = "1";
      const fn = text`print: ${content}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      fn();
    });

    it("should emit error when called with invalid templates arguments", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      text(["111", "222", "333"], "");
      expect(fn).toBeCalled();
      fn.mockReset();
      fn.mockRestore();
    });

    it("should emit error when called with non-reactive object child expression", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      text(["111", "222"], {});
      expect(fn).toBeCalled();
      fn.mockReset();
      fn.mockRestore();
    });
  });

  describe("bindAttr", () => {
    it("should bind attribute", () => {
      const disabled = source(false);
      const button = document.createElement("button");
      const cleanup = bindAttr(button, "disabled", disabled);
      expect(button.disabled).toBeFalsy();
      disabled.set(true);
      expect(button.disabled).toBeTruthy();
      cleanup();
      disabled.set(false);
      expect(button.disabled).toBeTruthy();
    });
  });

  describe("bindEvent", () => {
    it("should bind event", () => {
      const fn = import.meta.jest.fn();
      const buttonElement = document.createElement("button");
      const cleanup = bindEvent(buttonElement)("click", fn);
      buttonElement.click();
      expect(fn).toBeCalledTimes(1);
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
      cleanup();
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe("appendChild", () => {
    it("it should append child to given element", () => {
      const node = document.createElement("div");
      const p = document.createElement("p");
      appendChild(node)(p);
      expect(p.parentElement).toBe(node);
    });
  });

  describe("before", () => {
    it("it should insert element before given element", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      appendChild(container)(node);
      const p = document.createElement("p");
      before(node)(p);
      expect(p).toBe(node.previousElementSibling);
    });
  });

  describe("after", () => {
    it("should insert element after given element", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      appendChild(container)(node);
      const p = document.createElement("p");
      after(node)(p);
      expect(p).toBe(node.nextElementSibling);
    });
  });

  describe("seqAfter", () => {
    it("should insert sequence after given element", () => {
      const container = document.createElement("div");
      const childNode = document.createElement("button");
      appendChild(container)(childNode);
      const attach = seqAfter(childNode);
      const list = ["111", "222"];
      list.forEach((item) => {
        attach(new Text(item));
      });
      expect(container.textContent).toBe("111222");
    });
  });

  describe("remove", () => {
    it("should remove node", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      container.appendChild(node);
      expect(container.children.length).toBe(1);
      remove(node);
      expect(container.children.length).toBe(0);
    });
  });

  describe("moveRange", () => {
    it("should move nodes in given range", () => {
      const container = document.createElement("div");
      const box = document.createElement("div");
      const list = ["111", "222", "333", "444"];
      const fragment = list.map((item) => {
        const p = document.createElement("p");
        attr(p, "id", item);
        return p;
      });
      container.append(...fragment);

      const begin = fragment[1];
      const end = fragment[2];
      const render = moveRange(begin, end);
      render(appendChild(box));
      expect(Array.from(container.children)).toEqual([fragment[0], fragment[3]]);
      expect(Array.from(box.children)).toEqual([fragment[1], fragment[2]]);
    });
  });

  describe("insertSlot", () => {
    it("should insert element as slot", () => {
      const container = document.createElement("div");
      const slotElement = document.createElement("div");
      insertSlot(container, "test", slotElement);
      expect(slotElement.parentElement).toBe(container);
      expect(slotElement.slot).toBe("test");
    });
  });
});
