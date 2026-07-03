# Nadrix (NADX)

The value layer of the Nadrix ecosystem — a **fixed-cap, non-mintable** BEP-20 token on BNB Smart Chain.

NADX is assembled entirely from audited [OpenZeppelin](https://openzeppelin.com/contracts/) standard components (`ERC20` + `ERC20Capped` + `ERC20Burnable`) with **no custom token logic**.

## Token specification

| Item | Value |
|---|---|
| Standard | OpenZeppelin ERC20 + ERC20Capped + ERC20Burnable |
| Name | `Nadrix` |
| Symbol | `NADX` |
| Decimals | `18` |
| Cap (MAX_SUPPLY) | `10,000,000,000 x 10^18` (10 billion) |
| Minting | None — the full supply is minted once to the treasury in the constructor; the contract exposes no mint function |
| Burning | Retained (`burn` / `burnFrom`) |
| Transfer tax / blocklist / pausable / custom hooks | **None** |

## Deployment

- **Network:** BNB Smart Chain (BEP-20)
- **Contract:** [`0x7345bb126a7806Abe5E82fBBAf162797cFe599cB`](https://bscscan.com/address/0x7345bb126a7806Abe5E82fBBAf162797cFe599cB) — verified on BscScan
- The entire supply is minted at construction to a Gnosis Safe multisig treasury. The cap is fixed and the token is non-mintable, so no further issuance is possible.

## Version lock

- `solidity` = `0.8.24` (evmVersion `paris`, BSC-compatible)
- `@openzeppelin/contracts` = `5.1.0` (exact pin)
- All other dependencies are exact-pinned; see `package.json`.

## Layout

```
contracts/Nadrix.sol      Token contract
test/Nadrix.test.js       Unit tests (cap / non-mintable / burn / transfer)
scripts/deploy.js         Deploy + BscScan verification
hardhat.config.js         Network configuration
.env.example              Environment variable template
```

## Build & test

```bash
npm install --legacy-peer-deps
npm run build
npm test
```

## License

This project is licensed under the Business Source License 1.1 (BUSL-1.1). It is source-available but **not** an open-source license: production and commercial use are restricted until the Change Date (2030-07-03), when it converts to GPL-2.0-or-later. See the [LICENSE](./LICENSE) file for full terms.
