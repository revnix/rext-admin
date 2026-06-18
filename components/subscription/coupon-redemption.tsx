"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";

export function CouponRedemption() {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<{
    code: string;
    description: string;
  } | null>(null);

  const { fetchCredits, fetchSubscription } = useSubscriptionStore();

  const handleValidate = async () => {
    if (!code.trim()) return;
    
    try {
      setIsValidating(true);
      setValidatedCoupon(null);
      const res = await apiClient.subscriptions.validateCoupon(code.trim());
      
      if (res.valid) {
        setValidatedCoupon({
          code: code.trim(),
          description: res.description || "Valid coupon",
        });
      } else {
        toast.error("Invalid or expired coupon code");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!validatedCoupon) return;
    
    try {
      setIsRedeeming(true);
      await apiClient.subscriptions.redeemCoupon(validatedCoupon.code);
      
      toast.success("Coupon redeemed successfully!");
      setCode("");
      setValidatedCoupon(null);
      
      // Refresh credits and subscription data
      await Promise.allSettled([
        fetchCredits(),
        fetchSubscription({ force: true })
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to redeem coupon");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Redeem Coupon
        </CardTitle>
        <CardDescription>
          Have a promotional code or credit coupon? Enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setValidatedCoupon(null);
            }}
            disabled={isValidating || isRedeeming}
            className="flex-1 uppercase font-mono"
          />
          
          {validatedCoupon ? (
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming}
            >
              {isRedeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redeem Coupon
            </Button>
          ) : (
            <Button 
              onClick={handleValidate} 
              variant="secondary"
              disabled={isValidating || !code.trim()}
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate
            </Button>
          )}
        </div>
        
        {validatedCoupon && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
            Valid: {validatedCoupon.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
