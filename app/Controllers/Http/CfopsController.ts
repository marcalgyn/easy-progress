import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Cfop from 'App/Models/Cfop'

export default class CfopsController {
  public async index({ view }: HttpContextContract) {
    const objCfop = { id: 0, codigo: 0 }
    const cfops = await Cfop.query().orderBy('codigo', 'asc')

    return view.render('cfop', { objCfop, cfops })
  }

  public async edit({ view, params }: HttpContextContract) {
    const objCfop = await Cfop.findOrFail(params.id)
    const cfops = await Cfop.query().orderBy('codigo', 'asc')

    return view.render('cfop', { objCfop, cfops })
  }

  public async create({ request, response, session }: HttpContextContract) {

    const validationSchema = schema.create({
      codigo: schema.number(),
    })

    const validateData = await request.validate({
      schema: validationSchema,
      messages: {
        'codigo.required': 'Informe o Código do CFOP',
      },
    })

    try {

      if (request.input('id') === '0') {
        await Cfop.create({
          codigo: validateData.codigo
        })
        session.flash('notification', 'CFOP adicionado com sucesso!')
      } else {
        const cfop = await Cfop.findOrFail(request.input('id'))
        cfop.codigo = request.input('codigo')
        await cfop.save()
        session.flash('notification', 'CFOP alterado com sucesso!')
      }

    } catch (error) {
      let msg: string = "";
      if (error.code === 'ER_DUP_ENTRY') {
        msg = `CFOP ${validateData.codigo} já foi cadastrado.`
      }
      session.flash('notification', msg)
    }

    return response.redirect('back')
  }

  public async delete({ response, session, params }: HttpContextContract) {
    const cfop = await Cfop.findOrFail(params.id)

    await cfop.delete()

    session.flash('notification', 'CFOP excluído com sucesso!')

    return response.redirect('back')
  }

}
