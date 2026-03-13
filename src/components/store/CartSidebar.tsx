"use client";

import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export function CartSidebar() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, total, itemCount } =
    useCartStore();
  const count = itemCount();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 w-full max-w-[420px] h-screen bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h3 className="font-heading text-xl font-normal">
            Cart ({count})
          </h3>
          <button
            onClick={closeCart}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400">Browse our products to get started.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 py-4 border-b border-[#E2E8F0]"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-[#BDDBFA] to-[#EFF9FC] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      className="object-contain max-h-[50px]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.tagline}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-7 h-7 border border-[#E2E8F0] rounded flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-7 h-7 border border-[#E2E8F0] rounded flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-heading text-base font-bold">
                        {formatPrice(item.product.msrp * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E2E8F0] bg-[#F5F5F3]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-semibold">Total</span>
              <span className="font-heading text-2xl font-bold">
                {formatPrice(total())}
              </span>
            </div>
            <button className="w-full bg-[#020817] text-white py-3.5 rounded-lg font-bold text-[15px] hover:bg-[#333] transition-colors">
              Proceed to Checkout
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
