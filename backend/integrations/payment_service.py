"""
Direct Benefit Transfer (DBT) Payment Gateway Simulation Service.
Integrates with the Public Financial Management System (PFMS) and Aadhaar Payment Bridge.
Calculates net payout = MSP * Net Weight - Deductions, and generates auditable UTR references.
"""
from typing import Dict, Any
from datetime import datetime
import uuid
from backend.config.settings import settings

class PaymentService:
    def __init__(self):
        self.api_key = settings.PAYMENT_API_KEY
        self.demo_mode = settings.DEMO_MODE or not self.api_key

    def calculate_payment(self, net_quantity_quintals: float, msp_rate: float, deductions: float = 0.0) -> Dict[str, Any]:
        """Calculates gross and net payable amounts."""
        gross = round(net_quantity_quintals * msp_rate, 2)
        net = max(0.0, round(gross - deductions, 2))
        return {
            "net_quantity_quintals": net_quantity_quintals,
            "msp_rate": msp_rate,
            "gross_amount": gross,
            "deductions": deductions,
            "net_payable_amount": net
        }

    def process_dbt_settlement(
        self,
        farmer_id: str,
        bank_account: str,
        amount: float,
        booking_token: str
    ) -> Dict[str, Any]:
        """
        Executes Direct Benefit Transfer payout to farmer's linked bank account.
        Returns auditable transaction reference.
        """
        txn_ref = f"DBT-GOI-AGRI-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        return {
            "status": "PAYMENT_SETTLED",
            "dbt_transaction_ref": txn_ref,
            "amount": amount,
            "beneficiary_account": f"XXXXXX{bank_account[-4:]}" if bank_account and len(bank_account) >= 4 else "Aadhaar Linked",
            "settled_at": datetime.utcnow().isoformat(),
            "payment_gateway": "PFMS / Aadhaar Payment Bridge System (APBS)",
            "message": f"Successfully transferred Rs. {amount:,.2f} via Direct Benefit Transfer."
        }

payment_service = PaymentService()
