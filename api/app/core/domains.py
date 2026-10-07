"""The 5 fixed domains (graph-schema.md). This order is used everywhere, including the UI.

`app/schema/init.cypher` creates exactly these Domain nodes; `check_schema()` verifies it.
"""

from __future__ import annotations

DOMAINS: tuple[str, ...] = ("AI", "Cybersecurity", "IoT", "DevOps", "Cloud Migration")
