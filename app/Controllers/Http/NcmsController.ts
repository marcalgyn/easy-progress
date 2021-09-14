import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Ncm from 'App/Models/Ncm'

export default class NcmsController {
  public async index({ request, view }: HttpContextContract) {

    const page = request.input('page', 1)
    const limit = 5

    const objNcm = { id: 0, codigo: 0, aliquota: 0 }
    const ncms = await Ncm.query()
      .orderBy('codigo', 'asc')
      .paginate(page, limit)

    ncms.baseUrl('/ncms')

    return view.render('ncm', { objNcm, ncms })
  }

  public async edit({ request, view, params }: HttpContextContract) {

    const page = request.input('page', 1)
    const limit = 11

    const objNcm = await Ncm.findOrFail(params.id)
    const ncms = await Ncm.query()
      .orderBy('codigo', 'asc')
      .paginate(page, limit)

    ncms.baseUrl('/ncms')

    return view.render('ncm', { objNcm, ncms })
  }

  public async create({ request, response, session }: HttpContextContract) {

    const validationSchema = schema.create({
      codigo: schema.number(),
    })

    const validateData = await request.validate({
      schema: validationSchema,
      messages: {
        'codigo.required': 'Informe o Código do NCM',
      },
    })

    try {

      if (request.input('id') === '0') {
        await Ncm.create({
          codigo: validateData.codigo,
          aliquota: request.input('aliquota')
        })
        session.flash('notification', 'NCM adicionado com sucesso!')
      } else {
        const ncm = await Ncm.findOrFail(request.input('id'))
        ncm.codigo = request.input('codigo')
        ncm.aliquota = request.input('aliquota')
        await ncm.save()
        session.flash('notification', 'NCM alterado com sucesso!')
      }
    } catch (error) {
      let msg: string = "";
      if (error.code === 'ER_DUP_ENTRY') {
        msg = `NCM ${validateData.codigo} já foi cadastrado.`
      }
      session.flash('notification', msg)
    }

    return response.redirect('back')
  }

  public async delete({ response, session, params }: HttpContextContract) {
    const ncm = await Ncm.findOrFail(params.id)

    await ncm.delete()

    session.flash('notification', 'NCM excluído com sucesso!')

    return response.redirect('back')
  }

}
