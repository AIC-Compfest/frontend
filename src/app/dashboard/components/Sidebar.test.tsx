import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Sidebar, SIDEBAR_STORAGE_KEY, type DashboardTab } from "./Sidebar";

interface RenderOptions {
  currentTab?: DashboardTab;
  mobileOpen?: boolean;
}

function renderSidebar({ currentTab = "OVERVIEW", mobileOpen = false }: RenderOptions = {}) {
  const onTabChange = vi.fn();
  const onMobileOpenChange = vi.fn();
  render(
    <Sidebar
      currentTab={currentTab}
      onTabChange={onTabChange}
      mobileOpen={mobileOpen}
      onMobileOpenChange={onMobileOpenChange}
    />
  );
  return { onTabChange, onMobileOpenChange };
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.style.overflow = "";
});

afterEach(() => {
  cleanup();
});

describe("Sidebar navigation", () => {
  it("lists every tab and marks the current one", () => {
    renderSidebar({ currentTab: "QUEUE" });

    expect(screen.getByRole("button", { name: "Review Queue" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Logistics Partners" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Policy & Tolerance" })).toBeInTheDocument();
  });

  it("selects a tab and closes the drawer", () => {
    const { onTabChange, onMobileOpenChange } = renderSidebar({ mobileOpen: true });

    fireEvent.click(screen.getByRole("button", { name: "Audit Ledger Trail" }));

    expect(onTabChange).toHaveBeenCalledWith("AUDIT");
    expect(onMobileOpenChange).toHaveBeenCalledWith(false);
  });

  it("offers a sign-out link to /login", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Sign Out" })).toHaveAttribute("href", "/login");
  });
});

describe("Sidebar collapse", () => {
  it("collapses from the toggle and saves the choice", () => {
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("restores a saved collapsed state after mount", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    renderSidebar();

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("toggles with Ctrl+B and Cmd+B", () => {
    renderSidebar();

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");

    fireEvent.keyDown(window, { key: "b", metaKey: true });
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("false");
  });

  it("ignores Ctrl+B while the user is typing in a field", () => {
    renderSidebar();
    const field = document.createElement("input");
    document.body.appendChild(field);
    field.focus();

    fireEvent.keyDown(field, { key: "b", ctrlKey: true });

    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull();
    field.remove();
  });
});

describe("Sidebar mobile drawer", () => {
  it("closes on Escape", () => {
    const { onMobileOpenChange } = renderSidebar({ mobileOpen: true });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onMobileOpenChange).toHaveBeenCalledWith(false);
  });

  it("locks body scroll while open and focuses the close button", () => {
    renderSidebar({ mobileOpen: true });

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close menu" }));
  });

  it("keeps Tab focus inside the drawer", () => {
    renderSidebar({ mobileOpen: true });
    const drawer = screen.getByRole("complementary", { name: "Dashboard navigation" });
    const focusable = Array.from(drawer.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("closes from the backdrop", () => {
    const { onMobileOpenChange } = renderSidebar({ mobileOpen: true });

    const backdrop = document.querySelector('[aria-hidden="true"].fixed');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);

    expect(onMobileOpenChange).toHaveBeenCalledWith(false);
  });
});
