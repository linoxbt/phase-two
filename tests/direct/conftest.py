import datetime

CONTRACT_PATH = "contracts/surety.py"

# Fixed reference time used across tests; deadlines are computed relative to it.
NOW_ISO = "2026-01-01T00:00:00Z"
NOW_TS = int(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc).timestamp())
ONE_DAY = 24 * 60 * 60


def deploy_surety(direct_vm, direct_deploy):
    direct_vm.warp(NOW_ISO)
    return direct_deploy(CONTRACT_PATH)


def future_deadline(days: int = 7) -> int:
    return NOW_TS + days * ONE_DAY
