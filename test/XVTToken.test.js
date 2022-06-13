const {expect, use} = require('chai');
const {deployContract, MockProvider, solidity} = require('ethereum-waffle');
const XVTToken = require('../artifacts/contracts/XVTToken.sol/XVTToken.json');

use(solidity);

describe('XVTToken', () => {
  const [wallet, walletTo, walletThree, walletFour] = new MockProvider().getWallets();
  let token;

  beforeEach(async () => {
    token = await deployContract(wallet, XVTToken, [1000]);
  });

  it('Assigns initial balance', async () => {
    expect(await token.balanceOf(wallet.address)).to.equal(1000);
  });

  it('Transfer adds amount to destination account', async () => {
    await token.transfer(walletTo.address, 7);
    expect(await token.balanceOf(walletTo.address)).to.equal(7);
  });

  it('Transfer emits event', async () => {
    await expect(token.transfer(walletTo.address, 7))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, walletTo.address, 7);
  });

  it('transfer maximum amount ', async () => {
    await expect(token.transfer(walletTo.address, 
      115792089237316195423570985008687907853269984665640564039457584007913129639935))
      .to.be.reverted;
  });

  it('Cshould not allow transfer to 0x0', async () => {
    await expect(token.transfer('0x00000', 100)).to.be.reverted;
  });

  it('Can not transfer above the amount', async () => {
    await expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
  });

  it('Pause token transfer then unpause', async () => {
    await token.pause();
    await expect(token.transfer(wallet.address, 107)).to.be.reverted;
    await token.unPause();
    await token.transfer(walletTo.address, 107);
    expect(await token.balanceOf(walletTo.address)).to.equal(107);

  });

  it('Can not transfer from empty account', async () => {
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.transfer(wallet.address, 1))
      .to.be.reverted;
  });

  it('Calls totalSupply on BasicToken contract', async () => {
    await token.totalSupply();
    expect('totalSupply').to.be.calledOnContract(token);
  });

  it('Calls balanceOf with sender address on BasicToken contract', async () => {
    await token.balanceOf(wallet.address);
    expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address]);
  });

  it('Check the admin access control', async () =>{
    const isAdmin = await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE')), wallet.address);
    expect(isAdmin).to.equal(true);
  });

  it('Check the attorny access control', async () =>{
    const isAttorny = await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ATTORNEY_ROLE')), wallet.address);
    expect(isAttorny).to.equal(true);
  });

  it('Check the operator access control', async () =>{
    const isOperator = await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('OPERATOR_ROLE')), wallet.address);
    expect(isOperator).to.equal(true);
  });

  //whitelist
  it('Add an account to Whitelist', async ()=>{
    await token.addToWhitelist(walletTo.address);
    expect(await token.isWhitelisted(walletTo.address)).to.equal(true);
  });

  it('should not be allowed by normal users to add an account to Whitelist', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addToWhitelist(walletTo.address)).to.be.reverted;
  });

  it('can not add account to whitelist list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addToWhitelist(walletTo.address)).to.be.reverted;
  })

  it('can not add account to whitelist list when the account has whitelist', async ()=>{
    await token.addToWhitelist(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addToWhitelist(walletTo.address)).to.be.reverted;
  })

  it('can not add account to whitelist list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addToWhitelist(walletTo.address)).to.be.reverted;
  })

  it('can not add invalid address to whitelist', async ()=>{
    await expect( token.addToWhitelist('0x00000000')).to.be.reverted;
  })

  it('Remove an account from Whitelist', async ()=>{
    await token.addToWhitelist(walletTo.address);
    await token.removeFromWhitelist(walletTo.address);
    expect(await token.isWhitelisted(walletTo.address)).to.equal(false);
  });

  it('should not be allowed by normal users to remove an account to Whitelist', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.removeFromWhitelist(walletTo.address)).to.be.reverted;
  });

  it('can not remove an account to whitelist list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.removeFromWhitelist(walletTo.address)).to.be.reverted;
  })

  it('can not remove an account to whitelist list when the account has whitelist', async ()=>{
    await token.addToWhitelist(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.removeFromWhitelist(walletTo.address)).to.be.reverted;
  })

  it('can not remove an account to whitelist list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.removeFromWhitelist(walletTo.address)).to.be.reverted;
  })

  //freeze
  it('Freeze an account', async ()=>{
    await token.freeze(walletTo.address);
    expect(await token.isFrozen(walletTo.address)).to.equal(true);
  });

  it('should not be allowed by normal users to Freeze an account', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.freeze(walletTo.address)).to.be.reverted;
  });

  it('can not add account to frozen list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.freeze(walletTo.address)).to.be.reverted;
  })

  it('can not add account to frozen list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.freeze(walletTo.address)).to.be.reverted;
  })

  it('can not add invalid address to Frozen list', async ()=>{
    await expect( token.freeze('0x00000000')).to.be.reverted;
  })

  it('Remove an account from Frozen list', async ()=>{
    await token.freeze(walletTo.address);
    await token.unfreeze(walletTo.address);
    expect(await token.isFrozen(walletTo.address)).to.equal(false);
  });

  it('should not be allowed by normal users to unFreeze an account', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.unfreeze(walletTo.address)).to.be.reverted;
  });

  it('can not remove an account to frozen list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.unfreeze(walletTo.address)).to.be.reverted;
  })

  it('can not remove an account to frozen list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.unfreeze(walletTo.address)).to.be.reverted;
  })

  //Role adding scenarios
  //ADMIN_ROLE
  it('Add account to admin list', async ()=>{
    await token.addAdmin(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE')),
       walletTo.address)).to.equal(true);
  })

  it('can not add invalid address to admin list', async ()=>{
    await expect( token.addAdmin('0x00000000')).to.be.reverted;
  })

  it('can not add account to admin list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.addAdmin(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to add an account to admin list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAdmin(walletTo.address)).to.be.reverted;
  });

  it('can not add account to admin list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAdmin(walletTo.address)).to.be.reverted;
  })

  it('can not add account to admin list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAdmin(walletTo.address)).to.be.reverted;
  })

  it('revoke account from admin list', async ()=>{
    await token.addAdmin(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE')),
       walletTo.address)).to.equal(true);
    await token.revokeAdmin(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE')),
       walletTo.address)).to.equal(false);
  })

  it('can not revoke an account to admin list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.revokeAdmin(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to revoke an account to admin list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAdmin(walletTo.address)).to.be.reverted;
  });

  it('can not revoke an account to admin list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAdmin(walletTo.address)).to.be.reverted;
  })

  it('can not revoke an account to admin list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAdmin(walletTo.address)).to.be.reverted;
  })

//Operator
  it('Add account to operator list', async ()=>{
    await token.addOperator(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('OPERATOR_ROLE')),
       walletTo.address)).to.equal(true);
  })

  it('can not add account to operator list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.addOperator(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to add an account to operator list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addOperator(walletTo.address)).to.be.reverted;
  });

  it('can not add account to operator list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addOperator(walletTo.address)).to.be.reverted;
  })

  it('can not add invalid address to operator list', async ()=>{
    await expect( token.addOperator('0x00000000')).to.be.reverted;
  })

  it('revoke account from operator list', async ()=>{
    await token.addOperator(walletTo.address);
    await token.revokeOperator(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('OPERATOR_ROLE')),
       walletTo.address)).to.equal(false);
  })

  it('can not revoke an account to operator list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.revokeOperator(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to revoke an account to operator list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeOperator(walletTo.address)).to.be.reverted;
  });

  it('can not revoke an account to operator list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeOperator(walletTo.address)).to.be.reverted;
  })

//Attorney
  it('Add account to attorney list', async ()=>{
    await token.addAttorney(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ATTORNEY_ROLE')),
       walletTo.address)).to.equal(true);
  })

  it('can not add account to attorney list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.addAttorney(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to add an account to attorney list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAttorney(walletTo.address)).to.be.reverted;
  });

  it('can not add account to attorney list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAttorney(walletTo.address)).to.be.reverted;
  })

  it('can not add account to attorney list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.addAttorney(walletTo.address)).to.be.reverted;
  })

  it('can not add invalid address to attorney list', async ()=>{
    await expect( token.addAttorney('0x00000000')).to.be.reverted;
  })

  it('revoke account from attorney list', async ()=>{
    await token.addAttorney(walletTo.address);
    await token.revokeAttorney(walletTo.address);
    expect(await token.hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ATTORNEY_ROLE')),
       walletTo.address)).to.equal(false);
  })

  it('can not revoke account to attorney list when the account has freezed', async ()=>{
    await token.freeze(wallet.address)
    await expect( token.revokeAttorney(walletTo.address)).to.be.reverted;
  })

  it('should not be allowed by normal users to revoke an account to attorney list', async ()=>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAttorney(walletTo.address)).to.be.reverted;
  });

  it('can not revoke account to attorney list when the account has operator role', async ()=>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAttorney(walletTo.address)).to.be.reverted;
  })

  it('can not revoke account to attorney list when the account has attorney role', async ()=>{
    await token.addAttorney(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.revokeAttorney(walletTo.address)).to.be.reverted;
  })

  //multitransfer 
  it('token transfer to multiple account', async ()=>{
    await token.multiTransfer([walletTo.address, walletThree.address],[100,150]);
    expect(await token.balanceOf(walletTo.address)).to.equal(100);
    expect(await token.balanceOf(walletThree.address)).to.equal(150);
  })

  it('token transfer to multiple account, when the contract has paused', async ()=>{
    await token.pause();
    await expect(token.multiTransfer([walletTo.address, walletThree.address],[100,150])).to.be.reverted;
  })

  it('token transfer to multiple account, when the contract has Freezed', async ()=>{
    await token.freeze(wallet.address);
    await expect(token.multiTransfer([walletTo.address, walletThree.address],[100,150])).to.be.reverted;
  })

  it('token transfer to multiple account, when the recipients account has Freezed', async ()=>{
    await token.freeze(walletTo.address);
    await expect(token.multiTransfer([walletTo.address, walletThree.address],[100,150]))
    .to.emit(token, 'MultiTransferPrevented')
    .withArgs(wallet.address, walletTo.address, 100);
  })

  it('can not transfer by attorney', async () => {
    const tokenFromOtherWallet = token.connect(walletTo);
    await token.addAttorney(walletTo.address);
    await expect(tokenFromOtherWallet.multiTransfer([walletFour.address, walletThree.address],
      [100,150])).to.be.reverted;
  });


  it('Can not transfer above the amount(multitransaction)', async () => {
    await expect(token.multiTransfer([walletTo.address, walletThree.address],
      [1000,150])).to.be.reverted;
  });

  it('No of accounts not equals to no of amount', async () => {
    await expect(token.multiTransfer([walletTo.address, walletThree.address],
      [1000,150,200])).to.be.reverted;
  });

  it('multiTransaction mismatch of address and amount', async () => {
    await expect(token.multiTransfer([walletTo.address, walletThree.address, walletFour.address]
      ,[1000,150])).to.be.reverted;
  });

  it('multiTransaction to invalid address', async () => {
    await expect(token.multiTransfer([walletTo.address, walletThree.address, '0x0000000']
      ,[100,150])).to.be.reverted;
  });

  it('multiTransaction amount maximum', async () => {
    await expect(token.multiTransfer([walletTo.address, walletThree.address, walletFour.address],
      [1,2,115792089237316195423570985008687907853269984665640564039457584007913129639935])).to.be.reverted;
  });

  it('Can not transfer from empty account(multitransaction)', async () => {
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.multiTransfer([wallet.address], [1]))
      .to.be.reverted;
  });

  it('Can not transfer from empty role account', async () => {
    await token.transfer(walletTo.address, 100);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.multiTransfer([wallet.address], [50]))
      .to.be.reverted;
  });

  it('Can not transfer from unautherized account', async () => {
    await token.transfer(walletTo.address, 100);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.multiTransfer([wallet.address], [50]))
      .to.be.reverted;
  });

  it('mutiTransfer emits event', async () => {
    await expect( token.multiTransfer([walletTo.address],[100]))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, walletTo.address, 100);
  });

  //Burn method

  it('burn token', async () =>{
    await token.burn(wallet.address, 100);
    expect(await token.balanceOf(wallet.address)).to.be.equal('900');
    expect(await token.totalSupply()).to.be.equal('900');
  })

  it('can not burn token by normal user', async () =>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.burn(wallet.address, 100)).to.be.reverted;
  })

//Pause & unPause
  it('can not pause token by normal user', async () =>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.pause()).to.be.reverted;
  })

  it('can not unpause token by normal user', async () =>{
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.unPause()).to.be.reverted;
  })

  it('can not pause token by operator', async () =>{
    await token.addOperator(walletTo.address)
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.pause()).to.be.reverted;
  })

  it('can not pause token by operator', async () =>{
    await token.addOperator(walletTo.address)
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.unPause()).to.be.reverted;
  })

  //transferFrom

  it('transferFrom function', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await tokenFromOtherWallet.transferFrom(wallet.address, walletThree.address, 50)
    expect(await tokenFromOtherWallet.allowance(wallet.address,walletTo.address)).to.be.equal(50);
  })

  it('transferFrom function, send to invalid address', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.transferFrom(wallet.address, "0x00000000", 50)).to.be.reverted;
  })

  it('transferFrom function normal user', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.transferFrom(wallet.address, walletThree.address, 50)).to.be.reverted;
  })

  it('approve', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
  })

  it('increase allowance', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    await token.increaseAllowance(walletTo.address, 50);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(150);
  })

  it('increase allowance by normal user', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.increaseAllowance(walletTo.address, 50)).to.be.reverted;
  })

  it('decrease allowance', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    await token.decreaseAllowance(walletTo.address, 50);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(50);
  })

  it('decrease allowance by normal user', async () =>{
    await token.approve(walletTo.address, 100);
    expect(await token.allowance(wallet.address,walletTo.address)).to.be.equal(100);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.decreaseAllowance(walletTo.address, 50)).to.be.reverted;
  })

  it('approve by normal user', async () =>{
    await token.addOperator(walletTo.address);
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect( tokenFromOtherWallet.approve(walletThree.address, 100)).to.be.reverted;
  })

  it('approve to invalid address', async () =>{
    await expect( token.approve("0x00000000", 100)).to.be.reverted;

  })


});