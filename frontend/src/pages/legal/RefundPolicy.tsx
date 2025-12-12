/**
 * Refund Policy - Chargeback-resistant refund policy for virtual goods
 */

import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'December 9, 2025'
const COMPANY_NAME = '1v1bro'
const CONTACT_EMAIL = 'support@restaurantiq.us'

export function RefundPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-[#737373] hover:text-white mb-8 flex items-center gap-2 transition-colors text-[14px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <article className="prose prose-invert prose-sm max-w-none">
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-white mb-2">
            Refund Policy
          </h1>
          <p className="text-[#737373] text-sm mb-8">Last Updated: {LAST_UPDATED}</p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <p className="text-amber-400 text-sm font-medium mb-0">
              IMPORTANT: All purchases of virtual currency and virtual goods are final. Please read 
              this policy carefully before making any purchase.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">1. Virtual Goods Policy</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              {COMPANY_NAME} sells virtual currency ("Coins") and virtual goods (including skins, emotes, 
              Battle Pass access, and other cosmetic items). These are digital items that:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Are delivered instantly upon successful payment</li>
              <li>Are immediately available for use in your account</li>
              <li>Cannot be "returned" as they are digital licenses, not physical goods</li>
              <li>Have no real-world monetary value</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">2. No Refunds Policy</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-bold mb-2">
                ALL SALES ARE FINAL. NO REFUNDS WILL BE PROVIDED.
              </p>
              <p className="text-red-300 text-sm mb-0">
                By completing a purchase, you acknowledge that you are purchasing a license to use 
                virtual items, that delivery begins immediately, and that you waive your right to 
                cancel or receive a refund.
              </p>
            </div>
            <p className="text-[#B4B4B4] leading-[1.7]">
              This policy applies to all purchases, including but not limited to:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mt-4 space-y-2">
              <li>Coin packages of any size</li>
              <li>Battle Pass purchases</li>
              <li>Skin and cosmetic purchases</li>
              <li>Emote purchases</li>
              <li>Any other virtual items or currency</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">3. Why No Refunds?</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              Virtual goods are fundamentally different from physical products:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li><strong>Instant Delivery:</strong> Virtual items are credited to your account immediately upon payment confirmation</li>
              <li><strong>Immediate Use:</strong> You can use purchased items right away - there is no "unopened" state</li>
              <li><strong>No Return Possible:</strong> Unlike physical goods, digital items cannot be "returned" in their original condition</li>
              <li><strong>License Model:</strong> You are purchasing a license to use virtual items, not ownership of the items themselves</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">4. Before You Purchase</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              We encourage you to:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Review the item or package details carefully before purchasing</li>
              <li>Ensure you understand what you are buying</li>
              <li>Verify the price and quantity before confirming payment</li>
              <li>Try the free features of the game before making purchases</li>
              <li>Contact support if you have any questions before buying</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">5. Exceptional Circumstances</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              In rare cases, we may consider exceptions at our sole discretion:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li><strong>Duplicate Charges:</strong> If you were charged multiple times for the same purchase due to a technical error</li>
              <li><strong>Unauthorized Purchases:</strong> If your account was compromised and purchases were made without your authorization (requires police report)</li>
              <li><strong>Technical Failures:</strong> If payment was processed but items were not delivered due to a system error on our end</li>
            </ul>
            <p className="text-[#B4B4B4] leading-[1.7] mt-4">
              To request an exception review, contact us at {CONTACT_EMAIL} within 48 hours of the 
              purchase with your transaction details and explanation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">6. Chargebacks and Payment Disputes</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-bold mb-2">
                WARNING: Fraudulent chargebacks are taken very seriously.
              </p>
            </div>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              If you initiate a chargeback or payment dispute with your bank or credit card company:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Your account will be immediately suspended</li>
              <li>All virtual currency and items will be removed from your account</li>
              <li>Your account may be permanently banned</li>
              <li>We will provide evidence to your payment provider showing the purchase was legitimate and items were delivered</li>
              <li>We may pursue recovery of the disputed amount plus any fees we incur</li>
              <li>Fraudulent chargebacks may be reported to relevant authorities</li>
            </ul>
            <p className="text-[#B4B4B4] leading-[1.7] mt-4 font-medium">
              If you have a legitimate concern about a charge, please contact us FIRST at {CONTACT_EMAIL}. 
              We maintain detailed records of all transactions and can help resolve issues directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">7. Account Termination</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              If your account is terminated for violating our Terms of Service, you will not receive 
              a refund for any virtual currency or virtual goods associated with that account. 
              The license to use virtual items is contingent on maintaining an account in good standing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">8. Service Changes</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service, 
              including virtual items, at any time. No refunds will be provided if virtual items 
              are modified or removed from the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">9. Contact Us</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              If you have questions about this Refund Policy or need assistance with a purchase, 
              please contact us:
            </p>
            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-4">
              <p className="text-white font-medium mb-1">Email Support</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 hover:text-blue-400">
                {CONTACT_EMAIL}
              </a>
              <p className="text-[#737373] text-sm mt-3">
                Please include your account email and transaction ID when contacting support about purchases.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">10. Agreement</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              By making a purchase on {COMPANY_NAME}, you acknowledge that you have read, understood, 
              and agree to this Refund Policy. You confirm that you understand all sales are final 
              and that you waive your right to a refund upon completing a purchase.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
