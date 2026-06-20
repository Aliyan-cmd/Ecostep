from typing import Dict, Any

class OffsetEngine:
    def __init__(self):
        # In memory store mapping user_id -> accumulated spare change (cents)
        self._ledgers = {}
        self.THRESHOLD_CENTS = 500 # Triggers a mock Stripe offset at $5.00
        
    def process_transaction(self, user_id: str, amount_cents: int) -> Dict[str, Any]:
        """
        Calculates the spare change from a transaction amount.
        E.g., $12.30 (1230 cents) rounds up to $13.00 (1300 cents), yielding 70 cents to offset.
        """
        remainder = amount_cents % 100
        if remainder == 0:
            spare_change = 0
        else:
            spare_change = 100 - remainder
            
        current_balance = self._ledgers.get(user_id, 0)
        new_balance = current_balance + spare_change
        
        event_log = {
            "transaction_cents": amount_cents,
            "spare_change_cents": spare_change,
            "new_ledger_balance_cents": new_balance,
            "offset_triggered": False,
            "trees_planted": 0
        }
        
        # Trigger offset if threshold reached
        if new_balance >= self.THRESHOLD_CENTS:
            trees_to_plant = new_balance // self.THRESHOLD_CENTS
            event_log["offset_triggered"] = True
            event_log["trees_planted"] = trees_to_plant
            # Reset ledger subtracting the spent threshold
            new_balance = new_balance - (trees_to_plant * self.THRESHOLD_CENTS)
            # Simulated Stripe API call goes here
            
        self._ledgers[user_id] = new_balance
        event_log["new_ledger_balance_cents"] = new_balance
        
        return event_log

# Global singleton aggregator
eco_roundup_engine = OffsetEngine()
