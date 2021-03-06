import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Empresa from 'App/Models/Empresa';
import ItensNotaFiscal from 'App/Models/ItensNotaFiscal';
import NotaFiscal from 'App/Models/NotaFiscal';
import moment from 'moment';

export default class ConverterExcelsController {

  private onlyNumbers = (value: string) => value !== null ? value.replace(/[^\d]+/g, '') : null

  public async form({ view }: HttpContextContract) {
    const empresas = await Empresa.all()

    return view.render('converter/convertToExcel', { empresas })
  }

  public async convert({ request, response }: HttpContextContract) {

    const cnpjDestinatario = this.onlyNumbers(request.input('cnpjDestinatario'))
    const dataEmissaoInicial = request.input('dataEmissaoInicial')
    const dataEmissaoFinal = request.input('dataEmissaoFinal')
    console.log('cnpj', cnpjDestinatario);

    let notasFiscaisId: any
    if (cnpjDestinatario !== null && dataEmissaoInicial !== null && dataEmissaoFinal !== null) {
      notasFiscaisId = await NotaFiscal
        .query()
        .select('id')
        .where('cnpj_destinatario', cnpjDestinatario)
        .whereBetween('dataEmissao', [dataEmissaoInicial, dataEmissaoFinal])
        .orderBy('id')
    }

    const jsonIds = notasFiscaisId.map((item: { serialize: () => any }) => item.serialize().id)

    const itensNF = await ItensNotaFiscal
      .query()
      .select(
        'nf', 'descricao', 'cfop', 'ncm', 'cst', 'percentual', 'quantidade',
        'valor_unitario', 'valor_bruto', 'ipi', 'valor_desconto', 'valor_frete',
        'despesas_acessorias', 'valor_icms', 'aliquota_icms', 'sub_total', 'valor_imposto'
      )
      .whereIn('notaFiscalId', jsonIds)

    const itens = itensNF.map((item: { serialize: () => any }) => item.serialize())

    let fs = require('fs')

    const { jsonToXlsx } = require('json-and-xlsx')

    console.log(itens)

    const xls = jsonToXlsx.readAndGetBuffer(itens)

    let nomeArquivo = 'Relatorio_' + moment().format('DDMMYYYYHHmmss') + '.xls'

    const filePath = `downloads/${nomeArquivo}`

    fs.writeFileSync(Application.tmpPath(filePath), xls)

    const fileExcel = Application.tmpPath(filePath)

    response.attachment(fileExcel, nomeArquivo)

    // const json2xls = require('json2xls')

    // const xls = json2xls(itens)

    // let nomeArquivo = 'Relatorio_' + moment().format('DDMMYYYYHHmmss') + '.xls'

    // const filePath = `downloads/${nomeArquivo}`

    // fs.writeFileSync(Application.tmpPath(filePath), xls, 'binary')

    // const fileExcel = Application.tmpPath(filePath)

    // response.attachment(fileExcel, nomeArquivo)

  }

}