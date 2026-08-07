import time

from gltest import get_contract_factory
from gltest.contracts import Contract

CONTRACT_NAME = "Surety"

# request_release runs LLM judgment across 5 local validators (qwen2.5:1.5b on
# CPU) -- give it much more time than the default wait budget.
JUDGE_WAIT_RETRIES = 120
JUDGE_WAIT_INTERVAL = 3000


def deploy_surety(account=None, args=None):
    factory = get_contract_factory(CONTRACT_NAME)
    return factory.deploy(account=account, args=args)


def as_account(contract: Contract, account) -> Contract:
    """Rebind an already-deployed contract to a different calling account,
    reusing the already-fetched schema instead of a fresh network round trip."""
    return Contract.new(address=contract.address, schema=contract._schema, account=account)


def future_deadline(seconds: int = 7 * 24 * 3600) -> int:
    return int(time.time()) + seconds
