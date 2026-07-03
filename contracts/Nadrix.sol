// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title Nadrix (NADX)
 * @notice Nadrix 主价值币 — BSC (BEP-20) 上的固定封顶代币。
 *
 *  设计铁律(见 Nadrix 概念草稿 §六/§七):
 *   - 纯标准件:OpenZeppelin ERC20 + ERC20Capped + ERC20Burnable,只配置拼装,不自写 ERC20 逻辑。
 *   - 固定封顶 100 亿,不可增发:全量在 constructor 一次性铸给 treasury,合约不暴露任何 mint 函数,
 *     且 totalSupply 已等于 cap,即便有铸造路径也会被 Capped 挡死(铸满即停)。
 *   - 保留 Burnable(销毁用)。
 *   - 绝不加:fee-on-transfer 转账税 / 黑名单 / pausable / 自定义 transfer hook。
 *     —— 保持干净标准件,好审计、好上所。
 *   - 兑换手续费的"烧"不在本合约(那是"兑换网关层"的事)。
 */
contract Nadrix is ERC20, ERC20Capped, ERC20Burnable {
    /// @notice 总量封顶 = 100 亿 × 10^18。
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10 ** 18;

    /**
     * @param treasury 接收全量初始铸造的金库地址。
     *        主网 = Gnosis Safe 多签;测试网先用部署者地址。
     */
    constructor(address treasury) ERC20("Nadrix", "NADX") ERC20Capped(MAX_SUPPLY) {
        require(treasury != address(0), "Nadrix: treasury is the zero address");
        _mint(treasury, MAX_SUPPLY);
    }

    /**
     * @dev 解析 ERC20 与 ERC20Capped 的多继承 _update;不引入任何额外逻辑。
     *      ERC20Capped._update 负责封顶校验,确保 totalSupply 永不超过 cap。
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
