from conftest import deploy_surety, future_deadline

# NOTE: "submit after the deadline is blocked" can't be exercised in direct
# mode - same gltest harness gap documented in test_refund_expired.py
# (warp() doesn't propagate into message_raw['datetime'] for calls after
# direct_deploy()). Covered instead by integration tests against a running
# network, where wall-clock time actually advances.


def _create(contract, direct_vm, depositor, counterparty, spec="Ship it"):
    direct_vm.sender = depositor
    direct_vm.value = 1000
    eid = contract.create_engagement(counterparty, spec, future_deadline())
    direct_vm.value = 0
    return eid


def test_submit_deliverable_success(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_surety(direct_vm, direct_deploy)
    eid = _create(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_bob
    contract.submit_deliverable(eid, ["https://github.com/example/repo"], "done, see repo")

    eng = contract.get_engagement(eid)
    assert eng["status"] == "submitted"
    assert eng["notes"] == "done, see repo"
    assert list(eng["evidence_urls"]) == ["https://github.com/example/repo"]


def test_submit_deliverable_only_counterparty(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = deploy_surety(direct_vm, direct_deploy)
    eid = _create(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Only the counterparty may submit a deliverable"):
        contract.submit_deliverable(eid, ["https://example.com"], "notes")


def test_submit_deliverable_requires_evidence(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_surety(direct_vm, direct_deploy)
    eid = _create(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("At least one evidence URL is required"):
        contract.submit_deliverable(eid, [], "no proof")


def test_submit_deliverable_allows_resubmission(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_surety(direct_vm, direct_deploy)
    eid = _create(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_bob
    contract.submit_deliverable(eid, ["https://example.com/v1"], "v1")
    contract.submit_deliverable(eid, ["https://example.com/v2"], "v2")

    eng = contract.get_engagement(eid)
    assert eng["notes"] == "v2"
    assert list(eng["evidence_urls"]) == ["https://example.com/v2"]


def test_submit_deliverable_caps_url_count(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_surety(direct_vm, direct_deploy)
    eid = _create(contract, direct_vm, direct_alice, direct_bob)

    direct_vm.sender = direct_bob
    too_many = [f"https://example.com/{i}" for i in range(11)]
    with direct_vm.expect_revert("Too many evidence URLs"):
        contract.submit_deliverable(eid, too_many, "notes")
