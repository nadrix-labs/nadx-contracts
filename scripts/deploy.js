const { ethers, network, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("没有可用账户:请在 .env 配置 PRIVATE_KEY(测试网部署者)。");
  }

  // 测试网先用部署者地址作 treasury 跑通(主网换成 Gnosis Safe 多签地址)
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;

  // 主网红线守卫:treasury 必须显式配置、且不得等于部署者(防 100 亿铸进部署者 EOA)
  if (network.name === "bscMainnet") {
    if (!process.env.TREASURY_ADDRESS) {
      throw new Error("主网部署必须在 .env 显式配置 TREASURY_ADDRESS = Gnosis Safe 多签地址。");
    }
    if (treasury.toLowerCase() === deployer.address.toLowerCase()) {
      throw new Error("主网 treasury 不得等于部署者地址(必须是 Gnosis Safe 多签)。");
    }
    if (treasury !== ethers.getAddress(treasury)) {
      throw new Error("TREASURY_ADDRESS 校验和不合法,请逐字符核对。");
    }
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("网络:        ", network.name, "(chainId", network.config.chainId + ")");
  console.log("部署者:      ", deployer.address);
  console.log("部署者余额:  ", ethers.formatEther(balance), "BNB");
  console.log("treasury:    ", treasury);

  const Nadrix = await ethers.getContractFactory("Nadrix");
  const token = await Nadrix.deploy(treasury);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("\n✅ Nadrix 已部署:", address);
  console.log("   name:        ", await token.name());
  console.log("   symbol:      ", await token.symbol());
  console.log("   decimals:    ", await token.decimals());
  console.log("   cap:         ", (await token.cap()).toString());
  console.log("   totalSupply: ", (await token.totalSupply()).toString());
  console.log("   treasury 余额:", (await token.balanceOf(treasury)).toString());

  const isMainnet = network.name === "bscMainnet";
  const browserBase = isMainnet
    ? "https://bscscan.com/address/"
    : "https://testnet.bscscan.com/address/";
  console.log("\n浏览器:       " + browserBase + address);
  console.log("\n等待区块确认后再验证源码...");
  const deployTx = token.deploymentTransaction();
  if (deployTx) await deployTx.wait(5);
  if (process.env.BSCSCAN_API_KEY) {
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [treasury],
      });
      console.log("✅ 源码已在 BscScan 验证");
    } catch (e) {
      console.log("⚠️  自动验证失败,可手动跑:");
      console.log(
        `   npx hardhat verify --network ${network.name} ${address} ${treasury}`
      );
      console.log("   原因:", e.message);
    }
  } else {
    console.log("ℹ️  未配置 BSCSCAN_API_KEY,跳过自动验证。手动:");
    console.log(
      `   npx hardhat verify --network ${network.name} ${address} ${treasury}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
