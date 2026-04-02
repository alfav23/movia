import Form from "@/components/Form"

export default function Page() {
  return (
    <div>
      <div>
        <p>Hi, my name is Movia. What do you want to watch?</p>
      </div>
      <Form></Form>
      <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
  )
}
