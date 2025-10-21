import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const handlePointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    // If a Select/Popover is open, close it first and prevent the dialog overlay
    // from also handling this click. This avoids a race where both Radix primitives
    // try to close at the same time and can leave the page in a frozen state.
    let openPicker: Element | null = null
    try {
      openPicker = document.querySelector(
        '[data-slot="select-content"][data-state="open"], [data-slot="popover-content"][data-state="open"]'
      )
    } catch {
      // Non-fatal: if the DOM query fails, allow normal behavior
      console.debug('dialog overlay query error')
    }

    if (openPicker) {
      // If a picker is open, close it and prevent the dialog from also
      // closing on this same click. We prefer clicking the trigger; fallback
      // to Escape if trigger not found.
      try {
        const selectTrigger = document.querySelector('[data-slot="select-trigger"][aria-expanded="true"]') as HTMLElement | null
        const popoverTrigger = document.querySelector('[data-slot="popover-trigger"][aria-expanded="true"]') as HTMLElement | null

        if (selectTrigger) {
          selectTrigger.click()
        } else if (popoverTrigger) {
          popoverTrigger.click()
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        }
      } catch (err) {
        try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) } catch {}
      }

      // Prevent the dialog from handling the same click. This ensures only the
      // picker closes when clicking outside while it's open.
      try {
        const ne = e.nativeEvent as PointerEvent
        if (typeof ne.stopImmediatePropagation === 'function') ne.stopImmediatePropagation()
      } catch {}
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Forward any provided capture handler
    const typed = props as React.ComponentProps<typeof DialogPrimitive.Overlay>
    if (typeof typed.onPointerDownCapture === 'function') typed.onPointerDownCapture(e)
  }

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      onPointerDownCapture={handlePointerDownCapture}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  // When true, the overlay (dim background) will not be rendered.
  hideOverlay = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideOverlay?: boolean }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      {!hideOverlay && <DialogOverlay />}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
