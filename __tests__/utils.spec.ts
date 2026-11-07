import Module from "node:module"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { requireVanillaPuppeteer } from "../src/utils/require-vanilla-puppeteer.util"
import { getBrowserPath } from "../src/utils/browser.util"

const mocks = vi.hoisted(() => ({ existsSync: vi.fn(), executablePath: vi.fn() }))

vi.mock("node:fs", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:fs")>()
    return { ...actual, default: { ...actual, existsSync: mocks.existsSync }, existsSync: mocks.existsSync }
})

vi.mock("puppeteer-core", () => ({ executablePath: mocks.executablePath }))

afterEach(() => {
    vi.restoreAllMocks()
})

describe("getBrowserPath", () => {
    const original = process.env.LOCALAPPDATA
    const FALLBACK = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

    beforeEach(() => {
        mocks.existsSync.mockReset()
        mocks.executablePath.mockReset().mockReturnValue("/default/chrome")
    })

    afterEach(() => {
        if (original === undefined) {
            delete process.env.LOCALAPPDATA
        } else {
            process.env.LOCALAPPDATA = original
        }
    })

    it("returns the default puppeteer path when it exists", () => {
        mocks.existsSync.mockReturnValue(true)

        expect(getBrowserPath()).toBe("/default/chrome")
    })

    it.each([
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Users\\me\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ])("falls back to the installed browser %s", (installed) => {
        process.env.LOCALAPPDATA = "C:\\Users\\me\\AppData\\Local"
        mocks.existsSync.mockImplementation((p: string) => p.replace(/\//g, "\\") === installed)

        expect(getBrowserPath().replace(/\//g, "\\")).toBe(installed)
    })

    it("returns the default path when nothing is installed", () => {
        delete process.env.LOCALAPPDATA
        mocks.existsSync.mockReturnValue(false)

        expect(getBrowserPath()).toBe("/default/chrome")
    })

    it("returns the hardcoded chrome path when puppeteer cannot resolve one", () => {
        mocks.executablePath.mockImplementation(() => {
            throw new Error("no browser")
        })
        mocks.existsSync.mockReturnValue(false)

        expect(getBrowserPath()).toBe(FALLBACK)
    })
})

describe("requireVanillaPuppeteer", () => {
    const load = (Module as any)._load as (...args: unknown[]) => unknown

    function stubRequire(missing: string[]) {
        vi.spyOn(Module as any, "_load").mockImplementation(function (this: unknown, ...args: unknown[]) {
            const request = args[0] as string

            if (missing.includes(request)) {
                throw new Error(`Cannot find module '${request}'`)
            }

            if (request === "puppeteer" || request === "puppeteer-core") {
                return { name: request }
            }

            return load.apply(this, args)
        })
    }

    it("prefers puppeteer", () => {
        stubRequire([])

        expect(requireVanillaPuppeteer()).toEqual([{ name: "puppeteer" }, undefined])
    })

    it("falls back to puppeteer-core", () => {
        stubRequire(["puppeteer"])

        expect(requireVanillaPuppeteer()).toEqual([{ name: "puppeteer-core" }, undefined])
    })

    it("returns the error when neither is installed", () => {
        stubRequire(["puppeteer", "puppeteer-core"])

        const [lib, error] = requireVanillaPuppeteer()

        expect(lib).toBeUndefined()
        expect(error?.message).toContain("puppeteer-core")
    })
})
