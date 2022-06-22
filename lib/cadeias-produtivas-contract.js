/*
 * SPDX-License-Identifier: Apache-2.0
 */

/*
* @author   Evilasio de Sousa Junior
* @date     2022-06-22
* @reason   Smart Contract para Rastreabilidade em Cadeias Produtivas
*/

'use strict';

const { Contract } = require('fabric-contract-api');

class CadeiasProdutivasContract extends Contract {

    async cadeiasProdutivasExists(ctx, produtoLoteId) {
        const buffer = await ctx.stub.getState(produtoLoteId);
        return (!!buffer && buffer.length > 0);
    }

    async createCadeiasProdutivas(ctx, produtoLoteId, nome, ncm) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} ja existe`);
        }
        const asset = { 
            produtoLoteId: produtoLoteId,
            data: new Date(),
            nome: nome,
            ncm: ncm,
            insumos: [],
            utilizadoPor: []
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(produtoLoteId, buffer);
    }

    async readCadeiasProdutivas(ctx, produtoLoteId) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} does not exist`);
        }
        const buffer = await ctx.stub.getState(produtoLoteId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateCadeiasProdutivas(ctx, produtoLoteId, nome, ncm) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} does not exist`);
        }
        var dados = await ctx.stub.getState(produtoLoteId);
        var dadosJson = JSON.parse(dados);
        const asset = { 
            produtoLoteId: produtoLoteId,
            data: new Date(),
            nome: nome,
            ncm: ncm,
            insumos: dadosJson.insumos,
            utilizadoPor: dadosJson.utilizadoPor
            
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(produtoLoteId, buffer);
    }

    async deleteCadeiasProdutivas(ctx, produtoLoteId) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} does not exist`);
        }
        await ctx.stub.deleteState(produtoLoteId);
    }

    //Adiciona Insumo ao Produto/Lote (Composicao, Ingredientes, Embalagens e etc.). 
    //Ex.: Chocolate Ao Leite utiliza insumos como 
    //Acucar, Leite, Cacau em Po, Manteiga de Cacau
    async adicionarInsumoUtilizado(ctx, produtoLoteId, insumoUtilizadoProdutoLoteId, insumoUtilizadoNome, insumoUtilizadoNCM) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} nao existe`);
        }
        var dados = await ctx.stub.getState(produtoLoteId);
        var dadosJson = JSON.parse(dados);
        const insumo = { 
            produtoLoteId: insumoUtilizadoProdutoLoteId,
            nome: insumoUtilizadoNome,
            ncm: insumoUtilizadoNCM
        };

        dadosJson.insumos.push(insumo);
        const buffer = Buffer.from(JSON.stringify(dadosJson));
        await ctx.stub.putState(produtoLoteId, buffer);

        //Atualizar a lista de UtilizadoPor com o produtoLoteId
        await this.notificarUtilizacaoComoInsumo(ctx, insumoUtilizadoProdutoLoteId, insumoUtilizadoNome, insumoUtilizadoNCM, produtoLoteId, dadosJson.nome, dadosJson.ncm);

    }

    //Informa ao Produto/Lote que foi utilizado com insumo em outro produto. 
    //Ex.: Determinado Lote/Produto de Acucar foi utilizado 
    //em determinado Produto/Lote de Chocolate ao leite
    async notificarUtilizacaoComoInsumo(ctx, produtoLoteId, nome, ncm, utilizadoProdutoLoteId, utilizadoNome, utilizadoNCM) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) { //Se nao existir: Criar
            const asset = { 
                produtoLoteId: produtoLoteId,
                data: new Date(),
                nome: nome,
                ncm: ncm,
                insumos: [],
                utilizadoPor: []
            };
            const utilizadoPor = { 
                produtoLoteId: utilizadoProdutoLoteId,
                nome: utilizadoNome,
                ncm: utilizadoNCM
            };
            asset.utilizadoPor.push(utilizadoPor);
            const buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(produtoLoteId, buffer);

        }else{
            var dados = await ctx.stub.getState(produtoLoteId);
            var dadosJson = JSON.parse(dados);
            const asset = { 
                produtoLoteId: produtoLoteId,
                data: new Date(),
                nome: nome,
                ncm: ncm,
                insumos: dadosJson.insumos,
                utilizadoPor: dadosJson.utilizadoPor
                
            };
            const utilizadoPor = { 
                produtoLoteId: utilizadoProdutoLoteId,
                nome: utilizadoNome,
                ncm: utilizadoNCM
            };
            asset.utilizadoPor.push(utilizadoPor);
            const buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(produtoLoteId, buffer);
        }
    }

    //Busca o historico de transacoes sobre o produtoLoteId
    async obterHistoricoByProdutoLoteId(ctx, produtoLoteId) {
        const exists = await this.cadeiasProdutivasExists(ctx, produtoLoteId);
        if (!exists) {
            throw new Error(`O Produto/Lote:  ${produtoLoteId} nao existe`);
        }
        let iterator = await ctx.stub.getHistoryForKey(produtoLoteId);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
        if (res.value) {
            console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
            const obj = JSON.parse(res.value.value.toString('utf8'));
            result.push(obj);
        }
        res = await iterator.next();
        }
        await iterator.close();
        return result;
    }
}

module.exports = CadeiasProdutivasContract;
