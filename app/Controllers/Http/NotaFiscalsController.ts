import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ItensNotaFiscal from 'App/Models/ItensNotaFiscal'
import NotaFiscal from 'App/Models/NotaFiscal'

export default class NotaFiscalsController {

  private onlyNumbers = (value: string) => value !== null ? value.replace(/[^\d]+/g, '') : null

  public async index({ request, view }: HttpContextContract) {

    const page = request.input('page', 1)
    const limit = 10

    const notasFiscais = await NotaFiscal.query()
      .orderBy('dataEmissao', 'desc')
      .paginate(page, limit)

    notasFiscais.baseUrl('/notasFiscais')

    return view.render('notaFiscal', { notasFiscais })
  }

  public async findBy({ view, request }: HttpContextContract) {

    const page = request.input('page', 1)
    const limit = 10

    let notasFiscais: any

    const cnpjEmitente = this.onlyNumbers(request.input('cnpjEmitente'))
    const nf = this.onlyNumbers(request.input('nf'))
    const dataEmissaoInicial = request.input('dataEmissaoInicial')
    const dataEmissaoFinal = request.input('dataEmissaoFinal')

    if (cnpjEmitente !== null && dataEmissaoInicial !== null && dataEmissaoFinal !== null) {
      notasFiscais = await NotaFiscal
        .query()
        .where('cnpjEmitente', cnpjEmitente)
        .whereBetween('dataEmissao', [dataEmissaoInicial, dataEmissaoFinal])
        .orderBy('dataEmissao', 'desc')
        .paginate(page, limit)
    } else if (dataEmissaoInicial !== null && dataEmissaoFinal !== null) {
      notasFiscais = await NotaFiscal
        .query()
        .whereBetween('dataEmissao', [dataEmissaoInicial, dataEmissaoFinal])
        .orderBy('dataEmissao', 'desc')
        .paginate(page, limit)
    } else if (cnpjEmitente !== null) {
      notasFiscais = await NotaFiscal
        .query()
        .where('cnpjEmitente', cnpjEmitente)
        .orderBy('dataEmissao', 'desc')
        .paginate(page, limit)
    } else if (nf !== null) {
      notasFiscais = await NotaFiscal
        .query()
        .where('nf', nf)
        .orderBy('nomeCliente', 'asc')
        .paginate(page, limit)
    }

    notasFiscais.baseUrl('/notasFiscais')

    return view.render('notaFiscal', { notasFiscais })
  }

  public async delete({ response, session, params }: HttpContextContract) {
    const nf = await NotaFiscal.findOrFail(params.id)
    
     await ItensNotaFiscal
      .query()
      .where('notaFiscalId', params.id)
      .delete()

    await nf.delete()

    session.flash('notification', 'Nota Fiscal exclu??da com sucesso!')

    return response.redirect('back')
  }

  public async deleteAll({ response, session }: HttpContextContract) {
 
    await ItensNotaFiscal
      .query()  
      .delete()
    
    await NotaFiscal
    .query()
    .delete()

    session.flash('notification', 'Todos os Registros exclu??do com sucesso!')

    return response.redirect('back')
  }

}