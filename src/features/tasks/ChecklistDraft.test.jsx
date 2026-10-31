import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChecklistDraft from "./ChecklistDraft.jsx";

it("menunggu props induk untuk menambah, mengubah, dan menghapus item", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const initialItems = Object.freeze([
    Object.freeze({ id: "existing", title: "Awal" }),
  ]);
  const { rerender } = render(
    <ChecklistDraft items={initialItems} onChange={onChange} />,
  );
  const firstInput = screen.getByLabelText("Item checklist 1");

  await user.type(firstInput, "!");
  const editedItems = onChange.mock.lastCall[0];
  expect(editedItems).toEqual([{ id: "existing", title: "Awal!" }]);
  expect(firstInput).toHaveValue("Awal");
  expect(initialItems[0].title).toBe("Awal");
  rerender(<ChecklistDraft items={editedItems} onChange={onChange} />);
  expect(firstInput).toHaveValue("Awal!");

  const addButton = screen.getByRole("button", {
    name: "Tambah item checklist",
  });
  await user.click(addButton);
  const addedItems = onChange.mock.lastCall[0];
  expect(addedItems[0]).toBe(editedItems[0]);
  expect(addedItems[1]).toEqual({ id: expect.any(String), title: "" });
  expect(addedItems[1].id).not.toBe("existing");
  expect(screen.queryByLabelText("Item checklist 2")).not.toBeInTheDocument();
  expect(addButton).toHaveFocus();
  // Equivalent parent copies are accepted too; object identity is not required.
  rerender(
    <ChecklistDraft
      items={addedItems.map((item) => ({ ...item }))}
      onChange={onChange}
    />,
  );
  expect(screen.getByLabelText("Item checklist 2")).toHaveFocus();
  expect(screen.getByLabelText("Item checklist 1")).toBe(firstInput);

  await user.click(
    screen.getByRole("button", { name: "Hapus item checklist 1" }),
  );
  const removedItems = onChange.mock.lastCall[0];
  expect(removedItems).toEqual([addedItems[1]]);
  expect(screen.getByLabelText("Item checklist 1")).toHaveValue("Awal!");
  expect(
    screen.getByRole("button", { name: "Hapus item checklist 1" }),
  ).toHaveFocus();
  const remainingInput = screen.getByLabelText("Item checklist 2");
  rerender(<ChecklistDraft items={removedItems} onChange={onChange} />);
  expect(screen.getByLabelText("Item checklist 1")).toBe(remainingInput);
  expect(remainingInput).toHaveFocus();
  expect(remainingInput.closest("[data-checklist-id]")).toHaveAttribute(
    "data-checklist-id",
    addedItems[1].id,
  );
});

it("tidak mengubah item atau mencuri fokus ketika induk menolak permintaan", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const items = [
    { id: "first", title: "Satu" },
    { id: "second", title: "Dua" },
  ];
  const { rerender } = render(
    <ChecklistDraft items={items} onChange={onChange} />,
  );

  const removeButton = screen.getByRole("button", {
    name: "Hapus item checklist 1",
  });
  await user.click(removeButton);
  rerender(<ChecklistDraft items={items} onChange={onChange} />);
  expect(removeButton).toHaveFocus();
  expect(screen.getByLabelText("Item checklist 1")).toHaveValue("Satu");
  expect(screen.getByRole("status")).toHaveTextContent("2 item");

  const addButton = screen.getByRole("button", {
    name: "Tambah item checklist",
  });
  await user.click(addButton);
  const rejectedItems = onChange.mock.lastCall[0];
  rerender(<ChecklistDraft items={items} onChange={onChange} />);
  expect(addButton).toHaveFocus();
  expect(screen.queryByLabelText("Item checklist 3")).not.toBeInTheDocument();

  screen.getByLabelText("Item checklist 1").focus();
  rerender(<ChecklistDraft items={rejectedItems} onChange={onChange} />);
  expect(screen.getByLabelText("Item checklist 1")).toHaveFocus();
});

it("tidak memindahkan fokus setelah pengguna beralih sebelum permintaan diterima", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const items = [{ id: "first", title: "Satu" }];
  const { rerender } = render(
    <ChecklistDraft items={items} onChange={onChange} />,
  );
  await user.click(
    screen.getByRole("button", { name: "Tambah item checklist" }),
  );
  const nextItems = onChange.mock.lastCall[0];
  screen.getByLabelText("Item checklist 1").focus();
  rerender(<ChecklistDraft items={nextItems} onChange={onChange} />);
  expect(screen.getByLabelText("Item checklist 1")).toHaveFocus();
});

it("menonaktifkan semua kontrol tanpa callback atau ketika disabled", async () => {
  const user = userEvent.setup();
  const items = [{ id: "readonly", title: "Tetap" }];
  const onChange = vi.fn();
  const { rerender } = render(<ChecklistDraft items={items} />);
  for (const control of [
    ...screen.getAllByRole("button"),
    screen.getByLabelText("Item checklist 1"),
  ]) {
    expect(control).toBeDisabled();
  }
  await user.click(
    screen.getByRole("button", { name: "Tambah item checklist" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("1 item");

  rerender(<ChecklistDraft items={items} onChange={onChange} disabled />);
  await user.click(
    screen.getByRole("button", { name: "Hapus item checklist 1" }),
  );
  expect(screen.getByLabelText("Item checklist 1")).toBeDisabled();
  expect(screen.getByLabelText("Item checklist 1")).toHaveValue("Tetap");
  expect(onChange).not.toHaveBeenCalled();
});
