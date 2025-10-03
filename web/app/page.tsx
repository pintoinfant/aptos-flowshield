"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Shield, Box, Shuffle, Check, KeyRound, LogIn, LogOut } from "lucide-react"
import Link from "next/link"
import { StatsSection } from "@/components/stats-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FlowShield</span>
          </div>
          <Link href="/shield">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Launch App
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your On-Chain Privacy Shield
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            FlowShield breaks the link between your wallets, making your Aptos transaction history private and secure. 
            Deposit from one address, withdraw to another. Anonymously.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/shield">
              <Button size="lg" className="text-lg px-8 py-3">
                Launch App
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Three Steps to Financial Anonymity</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Deposit Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Connect your primary wallet and deposit a fixed amount of APT into a secure, audited smart contract.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Get Your Secret Note</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Receive a unique, private note. This is your proof of deposit and the only key to your funds.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Withdraw Anonymously</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                From any new wallet, use your secret note to withdraw your funds. No on-chain link, no history.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why FlowShield Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Built for Security</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Security-First with Move
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                FlowShield leverages the Move programming language, which is designed to prevent common exploits like re-entrancy. 
                Our contract is structurally safer than alternatives on other chains.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shuffle className="w-6 h-6 text-primary" />
                Low Fees, True Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Privacy shouldn't be a luxury. The high speed and low transaction fees on the Aptos network make protecting 
                your financial history accessible and affordable for everyone.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">Is FlowShield audited?</AccordionTrigger>
              <AccordionContent>
                This project is a hackathon submission and has not yet undergone a formal security audit. 
                Please use it with caution and at your own risk.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">Is my secret note stored anywhere?</AccordionTrigger>
              <AccordionContent>
                Absolutely not. Your secret note is generated in your browser and is never sent to our servers. 
                You are in complete control. If you lose your note, your funds are irrecoverable.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">How does this protect my privacy?</AccordionTrigger>
              <AccordionContent>
                FlowShield acts as a "clearing house." By pooling funds from many users, it becomes computationally 
                impossible to determine which depositor corresponds to which withdrawer, breaking the on-chain link.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-4 py-16 text-center border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Ready to Protect Your Privacy?</h3>
          <p className="text-muted-foreground mb-6">
            Join the privacy revolution on Aptos. Your financial freedom starts here.
          </p>
          <Link href="/shield">
            <Button size="lg" className="text-lg px-8 py-3">
              Launch FlowShield
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
