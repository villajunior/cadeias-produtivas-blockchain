/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { CadeiasProdutivasContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('CadeiasProdutivasContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new CadeiasProdutivasContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"cadeias produtivas 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"cadeias produtivas 1002 value"}'));
    });

    describe('#cadeiasProdutivasExists', () => {

        it('should return true for a cadeias produtivas', async () => {
            await contract.cadeiasProdutivasExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a cadeias produtivas that does not exist', async () => {
            await contract.cadeiasProdutivasExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCadeiasProdutivas', () => {

        it('should create a cadeias produtivas', async () => {
            await contract.createCadeiasProdutivas(ctx, '1003', 'cadeias produtivas 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"cadeias produtivas 1003 value"}'));
        });

        it('should throw an error for a cadeias produtivas that already exists', async () => {
            await contract.createCadeiasProdutivas(ctx, '1001', 'myvalue').should.be.rejectedWith(/The cadeias produtivas 1001 already exists/);
        });

    });

    describe('#readCadeiasProdutivas', () => {

        it('should return a cadeias produtivas', async () => {
            await contract.readCadeiasProdutivas(ctx, '1001').should.eventually.deep.equal({ value: 'cadeias produtivas 1001 value' });
        });

        it('should throw an error for a cadeias produtivas that does not exist', async () => {
            await contract.readCadeiasProdutivas(ctx, '1003').should.be.rejectedWith(/The cadeias produtivas 1003 does not exist/);
        });

    });

    describe('#updateCadeiasProdutivas', () => {

        it('should update a cadeias produtivas', async () => {
            await contract.updateCadeiasProdutivas(ctx, '1001', 'cadeias produtivas 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"cadeias produtivas 1001 new value"}'));
        });

        it('should throw an error for a cadeias produtivas that does not exist', async () => {
            await contract.updateCadeiasProdutivas(ctx, '1003', 'cadeias produtivas 1003 new value').should.be.rejectedWith(/The cadeias produtivas 1003 does not exist/);
        });

    });

    describe('#deleteCadeiasProdutivas', () => {

        it('should delete a cadeias produtivas', async () => {
            await contract.deleteCadeiasProdutivas(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a cadeias produtivas that does not exist', async () => {
            await contract.deleteCadeiasProdutivas(ctx, '1003').should.be.rejectedWith(/The cadeias produtivas 1003 does not exist/);
        });

    });

});
