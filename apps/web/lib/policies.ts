export const policies: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Shipping",
    body: [
      "We ship across India. Orders of ₹999 and above go out with free shipping. Below that, shipping is a flat ₹79.",
      "Most orders leave within two working days. Metro cities usually arrive in 3–5 working days, and other pincodes in 5–7. Remote pincodes can take longer, and we will write if a courier cannot serve the pin.",
      "Cash on delivery is offered only on products we have marked for it. If a basket includes a prepaid-only product, the whole order is paid online. When COD is available, the courier collects the order total. If a COD parcel is refused, we may decline COD on the next order.",
      "You will see the order status in your account: confirmed, packed, shipped, and delivered. A tracking number is added by the team once the parcel is handed to the courier.",
    ],
  },
  returns: {
    title: "Returns and replacements",
    body: [
      "If something arrives damaged, write to us within 48 hours with a photo of the parcel and the product. We replace manufacturing defects and transit damage.",
      "Unused kitchenware and door guards can be returned within 7 days of delivery, in original packing, with the tags still on. Sealed strips and hinge guards that have been stuck or fitted are not returnable, because they cannot be resold.",
      "Refunds for prepaid orders go back to the original payment method after we receive and check the return. COD refunds are sent by bank transfer once you share the account details.",
      "A manufacturing defect reported within 6 months is repaired or replaced. Normal wear, a burnt non-stick surface, or a seal that was trimmed and then removed is not a defect.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "We collect the name, email, mobile number, and address you give us so we can take the order, ship it, and reach you if the courier cannot. If you create an account, we also store a password hash, never the password itself.",
      "Payment card and UPI details are handled by Razorpay. Nestfab does not store card numbers.",
      "We do not sell your data. Order details are shared with the courier and, when you pay online, with Razorpay, because that is how the parcel and the payment move.",
      "You can ask us to correct your account details from the account page, or write via the contact form to ask what we hold about you.",
    ],
  },
  terms: {
    title: "Terms",
    body: [
      "This website sells Nestfab kitchenware, door guards, and related home products to customers in India. Prices are in Indian rupees and include GST.",
      "A struck-through price is the usual marketplace price we have recorded for that product. It is not a guarantee of a discount on every other website, and the admin team should keep it honest.",
      "Placing an order is an offer to buy. We accept it when the order is confirmed. If an item is priced by mistake or cannot be supplied, we will cancel that line and refund what you paid for it.",
      "The site and the products are offered as described on each product page. Care instructions are part of the product, and ignoring them can void a replacement.",
    ],
  },
};
