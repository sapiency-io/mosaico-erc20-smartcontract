var utils = web3.utils;
const MosaicoERC20 = artifacts.require("WrappedMosContract");

require('truffle-test-utils').init();

require('chai').should();

contract('MosaicoWrappedMOSContract', accounts => {
    const _name = "wrappedMOS";
    const _symbol = "wMOS";
    const _decimals = 18;
    const _totalSupply = utils.toBN(utils.toWei("100000000", 'ether'));
    const _genesisAddress = "0x0000000000000000000000000000000000000000";

    let contract;

    beforeEach(async function () {
        contract = await MosaicoERC20.new();
    });

    describe('ERC20 Attributes', function () {
        it('has the correct name', async function () {
            //act
            let tokenName = await contract.name();
            //assert
            tokenName.should.equal(_name);
        });

        it('has correct symbol', async function () {
            //act
            let tokenSymbol = await contract.symbol();
            //assert
            tokenSymbol.should.equal(_symbol);
        });

        it('has correct decimals', async function () {
            //act
            let tokenDecimals = await contract.decimals();
            //assert
            tokenDecimals.toNumber().should.equal(_decimals);
        });

        it('has correct total supply', async function () {
            //act
            let totalSupply = await contract.totalSupply();
            //assert
            assert.isTrue(totalSupply.eq(_totalSupply));
        });
        
        it('creator has all tokens', async function () {
            //act
            let balance = await contract.balanceOf(accounts[0]);
            //assert
            assert.isTrue(balance.eq(_totalSupply));
        });

    });

    describe('ERC20 Transfer', function () {
        it('should not change total supply', async function () {    
            //arrange
            const owner = accounts[0];
            const countToSend = utils.toBN(100);
            const accountToReceive = accounts[1];
            //act
            await contract.transfer(accountToReceive, countToSend);
            //assert
            let balance = await contract.balanceOf(accountToReceive);
            assert.isTrue(balance.eq(countToSend));            
            let ownerBalance = await contract.balanceOf(owner);
            assert.isTrue(ownerBalance.eq(_totalSupply.sub(countToSend)));
            let totalSupply = await contract.totalSupply();
            assert.isTrue(totalSupply.eq(_totalSupply));
        });

        it('should send tokens to another account', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const accountToReceive = accounts[1];
            //act
            await contract.transfer(accountToReceive, countToSend);
            //assert
            let balance = await contract.balanceOf(accountToReceive);
            assert.isTrue(balance.eq(countToSend));
        });

        it('should not send tokens if no allowance for owner', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const owner = accounts[0];
            const accountToReceive = accounts[2];
            //act
            try {
                await contract.transferFrom(owner, accountToReceive, countToSend);
                throw "succeeded";
            }
            catch (error) {
                //assert
                error.should.not.equal("succeeded");
            }
        });

        it('should not send tokens if no allowance', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const accountToSend = accounts[1];
            const accountToReceive = accounts[2];
            //act
            try {
                await contract.transferFrom(accountToSend, accountToReceive, countToSend);
                throw "succeeded";
            }
            catch (error) {
                //assert
                error.should.not.equal("succeeded");
            }
        });

        it('should be transferable from owner', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const owner = accounts[0];
            const accountToReceive = accounts[2];
            //act
            await contract.approve(owner, countToSend);
            await contract.transferFrom(owner, accountToReceive, countToSend);
            //assert
            let balance = await contract.balanceOf(accountToReceive);
            assert.isTrue(balance.eq(countToSend));
        });

        it('should send tokens if allowance', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const accountToSend = accounts[1];
            const accountToReceive = accounts[2];
            await contract.approve(accountToSend, countToSend);
            //act
            await contract.transferFrom(accounts[0], accountToReceive, countToSend, {from: accountToSend});
            //assert
            let balance = await contract.balanceOf(accountToReceive);
            assert.isTrue(balance.eq(countToSend));
        });
    });

    describe('ERC20 Events', function () {
        it('should emit transfer event', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const accountToReceive = accounts[1];
            //act
            let result = await contract.transfer(accountToReceive, countToSend);
            assert.web3Event(result, {
                event: 'Transfer'
              }, 'The event is emitted'
            );
        });

        it('should emit approval event', async function () {
            //arrange
            const countToSend = utils.toBN(100);
            const accountToSend = accounts[1];
            await contract.transfer(accountToSend, countToSend);
            //act
            let result = await contract.approve(accountToSend, countToSend);
            //assert
            assert.web3Event(result, {
                event: 'Approval'
              }, 'The event is emitted'
            );
        });
    });

    describe('Ownership', function () {
        it('is owner', async function () {
            //arrange
            const owner = accounts[0];
            //act
            let result = await contract.isOwner({from: owner});
            //assert
            assert.isTrue(result);
        });

        it('is not owner', async function () {
            //arrange
            const account = accounts[1];
            //act
            let result = await contract.isOwner({from: account});
            //assert
            result.should.equal(false);
        });
    });

    describe('Burnability', function () {
        it('should burn valid tokens quantity', async function () {
            //arrange
            const owner = accounts[0];
            const burnQuantity = utils.toBN(100);
            //act
            let result = await contract.burn(burnQuantity);
            let totalSupply = await contract.totalSupply();
            //assert
            assert.web3Event(result, {
                event: 'Transfer', 
                args: {
                    0: owner,
                    1: _genesisAddress,
                    2: burnQuantity.toNumber(),
                    __length__: 3,
                    _from: owner,
                    _to: _genesisAddress,
                    _value: burnQuantity.toNumber()
                }
              }, 'The event is emitted'
            );
            assert.isTrue(totalSupply.eq(_totalSupply.sub(burnQuantity)));
        });

        it('should fail when try burn more then address balance', async function () {
            //arrange
            const owner = accounts[0];
            const burnQuantity = _totalSupply.add(utils.toBN(1));
            //act            
            try {
                await contract.burn(burnQuantity);
                throw "succeeded";
            }
            catch (error) {
                //assert
                error.should.not.equal("succeeded");
            }   
        });

    });

    describe('Mintability', function () {
        it('should mint tokens for owner address', async function () {
            //arrange
            const owner = accounts[0];
            const mintQuantity = utils.toBN(100);
            const newTotalSupply = _totalSupply.add(mintQuantity)
            //act
            let result = await contract.mint(mintQuantity);
            let totalSupply = await contract.totalSupply();
            let ownerBalance = await contract.balanceOf(owner);
            //assert
            assert.web3Event(result, {
                event: 'Transfer',
                args: {
                    0: _genesisAddress,
                    1: owner,
                    2: mintQuantity.toNumber(),
                    __length__: 3,
                    _from: _genesisAddress,
                    _to: owner,
                    _value: mintQuantity.toNumber()
                }
              }, 'The event is emitted'
            );
            assert.isTrue(totalSupply.eq(newTotalSupply));
            assert.isTrue(ownerBalance.eq(newTotalSupply));
        });

        it('should fail when not owner try mint', async function () {
            //arrange
            const minter = accounts[1];
            const mintQuantity = _totalSupply.add(utils.toBN(1));
            //act            
            try {
                await contract.mint(mintQuantity, {from: minter});
                throw "succeeded";
            }
            catch (error) {
                //assert
                error.should.not.equal("succeeded");
            }   
        });

    });
    
});