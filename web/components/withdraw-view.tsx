"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"

export function WithdrawView() {
  const [secretNote, setSecretNote] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleWithdraw = async () => {
    if (!secretNote.trim()) {
      toast({
        title: "Secret Note Required",
        description: "Please enter your secret note",
        variant: "destructive",
      })
      return
    }

    if (!recipientAddress.trim()) {
      toast({
        title: "Recipient Address Required",
        description: "Please enter a recipient address",
        variant: "destructive",
      })
      return
    }

    if (!recipientAddress.startsWith("0x")) {
      toast({
        title: "Invalid Address",
        description: "Address must start with 0x",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate withdrawal transaction
    await new Promise((resolve) => setTimeout(resolve, 2500))

    setIsLoading(false)

    toast({
      title: "Withdrawal Successful",
      description: `Funds sent to ${recipientAddress.substring(0, 10)}...`,
    })

    // Reset form
    setSecretNote("")
    setRecipientAddress("")
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Security Warning</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never share your secret note with anyone. Make sure you're withdrawing to a different address than the one
              you deposited from.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="secret-note" className="text-base font-semibold mb-2 block">
            Secret Note
          </Label>
          <Textarea
            id="secret-note"
            placeholder="veil-xxxxxxxxxxxxxxxxxxxxx"
            value={secretNote}
            onChange={(e) => setSecretNote(e.target.value)}
            className="bg-secondary border-border font-mono text-sm min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">Enter the secret note you received when depositing</p>
        </div>

        <div>
          <Label htmlFor="recipient" className="text-base font-semibold mb-2 block">
            Recipient Address
          </Label>
          <Input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="bg-secondary border-border font-mono h-12"
          />
          <p className="text-xs text-muted-foreground mt-2">The address where you want to receive the funds</p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !secretNote || !recipientAddress}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
          >
            {isLoading ? "Processing Withdrawal..." : "Withdraw Funds"}
          </Button>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Privacy Note:</span> Withdrawals are processed through
            zero-knowledge proofs to ensure your transaction privacy. The withdrawal process may take a few moments.
          </p>
        </div>
      </div>
    </Card>
  )
}
