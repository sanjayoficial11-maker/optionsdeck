import Link from "next/link"
import { Construction, ArrowLeft } from "lucide-react"
import { findNavItem } from "@/lib/nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function ComingSoonPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const href = "/" + slug.join("/")
  const item = findNavItem(href)

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">{item?.title ?? "Module"} is on the way</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {item?.description
            ? `${item.description} — this module is being built next.`
            : "This section is being built as part of the phased rollout."}
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" /> Back to dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
