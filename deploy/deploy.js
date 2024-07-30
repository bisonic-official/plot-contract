const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("Deploying contracts with the account:", deployer);

    try {
        const runiverseLandContract = await deploy('RuniverseLand', {
            from: deployer,
            args: [
                "https://api.runiverse.world/GetNewPlotInfo?PlotId="
            ],
            log: true,
            gasPrice: 30000000000
        });

        const runiverseLandMinterContract = await deploy('RuniverseLandMinter', {
            from: deployer,
            args: [
                runiverseLandContract.address
            ],
            log: true,
            gasPrice: 30000000000
        });
    } catch (error) {
        console.error("Error deploying contracts:", error);
    }
};

module.exports = func;
func.tags = ['RuniverseLand'];
