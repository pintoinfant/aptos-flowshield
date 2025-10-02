"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const handleConnect = () => {
    // Mock wallet connection
    const mockAddress = "0x" + Math.random().toString(16).substring(2, 10)
    setWalletAddress(mockAddress)
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setWalletAddress("")
    setIsConnected(false)
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <span className="text-xl font-bold">Veil Mixer</span>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-secondary rounded-lg border border-border">
              <span className="text-sm font-mono">{walletAddress}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  )
}
