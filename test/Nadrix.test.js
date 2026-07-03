const { expect } = require("chai");
const { ethers } = require("hardhat");

const MAX_SUPPLY = 10_000_000_000n * 10n ** 18n; // 100 亿 × 10^18

describe("Nadrix (NADX)", function () {
  let token, deployer, treasury, alice, bob;

  beforeEach(async function () {
    [deployer, treasury, alice, bob] = await ethers.getSigners();
    const Nadrix = await ethers.getContractFactory("Nadrix");
    token = await Nadrix.deploy(treasury.address);
    await token.waitForDeployment();
  });

  describe("元数据 / 初始状态", function () {
    it("name = Nadrix, symbol = NADX, decimals = 18", async function () {
      expect(await token.name()).to.equal("Nadrix");
      expect(await token.symbol()).to.equal("NADX");
      expect(await token.decimals()).to.equal(18);
    });

    it("cap = MAX_SUPPLY = 100 亿,且全量铸给 treasury", async function () {
      expect(await token.cap()).to.equal(MAX_SUPPLY);
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await token.balanceOf(treasury.address)).to.equal(MAX_SUPPLY);
    });

    it("部署者地址不持有任何代币(全量在 treasury)", async function () {
      expect(await token.balanceOf(deployer.address)).to.equal(0n);
    });

    it("treasury 为零地址时部署 revert", async function () {
      const Nadrix = await ethers.getContractFactory("Nadrix");
      await expect(Nadrix.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "Nadrix: treasury is the zero address"
      );
    });
  });

  describe("铸满即停 / 不可增发", function () {
    it("totalSupply 在部署后即等于 cap(已铸满)", async function () {
      expect(await token.totalSupply()).to.equal(await token.cap());
    });

    it("合约不暴露任何外部 mint 函数", async function () {
      expect(token.mint).to.be.undefined;
      // 也确认 ABI 中不含 mint
      const hasMint = token.interface.fragments.some(
        (f) => f.type === "function" && f.name === "mint"
      );
      expect(hasMint).to.equal(false);
    });
  });

  describe("burn(销毁)", function () {
    it("持有者可 burn,自身余额与 totalSupply 同步下降", async function () {
      const burnAmount = 1_000n * 10n ** 18n;
      const before = await token.totalSupply();
      await token.connect(treasury).burn(burnAmount);
      expect(await token.balanceOf(treasury.address)).to.equal(MAX_SUPPLY - burnAmount);
      expect(await token.totalSupply()).to.equal(before - burnAmount);
    });

    it("burn 后 cap 不变,且烧掉的额度无法被重新铸出(cap 是上限非目标)", async function () {
      const burnAmount = 5_000n * 10n ** 18n;
      await token.connect(treasury).burn(burnAmount);
      expect(await token.cap()).to.equal(MAX_SUPPLY); // cap 恒定
      expect(await token.totalSupply()).to.be.lessThan(await token.cap());
      // 合约无 mint 入口,被烧额度永久消失 —— 通缩,不可复铸
    });

    it("burnFrom 在 approve 后可由第三方代烧,并扣减 allowance", async function () {
      const amount = 2_000n * 10n ** 18n;
      await token.connect(treasury).approve(alice.address, amount);
      await token.connect(alice).burnFrom(treasury.address, amount);
      expect(await token.balanceOf(treasury.address)).to.equal(MAX_SUPPLY - amount);
      expect(await token.allowance(treasury.address, alice.address)).to.equal(0n);
    });

    it("超出余额的 burn 会 revert", async function () {
      await expect(token.connect(alice).burn(1n)).to.be.reverted; // alice 余额为 0
    });
  });

  describe("普通转账", function () {
    it("transfer 正常,余额正确变动", async function () {
      const amount = 1_234n * 10n ** 18n;
      await token.connect(treasury).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.balanceOf(treasury.address)).to.equal(MAX_SUPPLY - amount);
    });

    it("无转账税 —— 收款方收到的 == 发送的全额(非 fee-on-transfer)", async function () {
      const amount = 777n * 10n ** 18n;
      await token.connect(treasury).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("approve + transferFrom 正常,allowance 正确扣减", async function () {
      const amount = 500n * 10n ** 18n;
      await token.connect(treasury).approve(alice.address, amount);
      await token.connect(alice).transferFrom(treasury.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
      expect(await token.allowance(treasury.address, alice.address)).to.equal(0n);
    });

    it("余额不足的 transfer 会 revert", async function () {
      await expect(
        token.connect(alice).transfer(bob.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });
});
