"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { SecretNoteModal } from "@/components/secret-note-modal"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

const POOLS = [
  { amount: 0.1, label: "0.1 APT" },
  { amount: 1, label: "1 APT" },
  { amount: 10, label: "10 APT" },
  { amount: 100, label: "100 APT" },
]

export function DepositView() {
  const [selectedPool, setSelectedPool] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [secretNote, setSecretNote] = useState("")
  const { toast } = useToast()

  const handleDeposit = async () => {
    const amount = selectedPool || Number.parseFloat(customAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select a pool or enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate deposit transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock secret note
    const mockNote =
      "veil-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)

    setSecretNote(mockNote)
    setIsLoading(false)
    setShowSecretModal(true)
  }

  return (
    <>
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Pool Amount</Label>
            <div className="grid grid-cols-2 gap-3">
              {POOLS.map((pool) => (
                <button
                  key={pool.amount}
                  onClick={() => {
                    setSelectedPool(pool.amount)
                    setCustomAmount("")
                  }}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${
                      selectedPool === pool.amount
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-primary/50"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{pool.label}</span>
                    {selectedPool === pool.amount && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div>
            <Label htmlFor="custom-amount" className="text-base font-semibold mb-2 block">
              Custom Amount
            </Label>
            <div className="relative">
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedPool(null)
                }}
                className="pr-16 bg-secondary border-border text-lg h-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">APT</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleDeposit}
              disabled={isLoading || (!selectedPool && !customAmount)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
            >
              {isLoading ? "Processing..." : "Deposit to Pool"}
            </Button>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Note:</span> After depositing, you will receive a secret
              note. Keep this note safe - you will need it to withdraw your funds to a different address.
            </p>
          </div>
        </div>
      </Card>

      <SecretNoteModal isOpen={showSecretModal} onClose={() => setShowSecretModal(false)} secretNote={secretNote} />
    </>
  )
}
