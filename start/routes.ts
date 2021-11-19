import Route from '@ioc:Adonis/Core/Route'

Route.get('/', 'ConvertersController.index').middleware('auth')
Route.get('/converter', 'ConvertersController.index').middleware('auth')

Route.post('/processar', 'ProcessosController.process').middleware('auth')

Route.get('/converter-form', 'ConverterExcelsController.form').middleware('auth')
Route.post('/converter-excel', 'ConverterExcelsController.convert').middleware('auth')

Route.group(() => {
  Route.get('/', 'CfopsController.index')
  Route.get('/:id', 'CfopsController.edit')
  Route.post('/', 'CfopsController.create')
  Route.post('/:id', 'CfopsController.update')
  Route.delete('/:id', 'CfopsController.delete')
}).prefix('/cfops').middleware('auth')

Route.group(() => {
  Route.get('/', 'NcmsController.index')
  Route.get('/:id', 'NcmsController.edit')
  Route.post('/', 'NcmsController.create')
  Route.post('/:id', 'NcmsController.update')
  Route.delete('/:id', 'NcmsController.delete')
}).prefix('/ncms').middleware('auth')

Route.group(() => {
  Route.get('/', 'EmpresasController.index')
  Route.get('/:id', 'EmpresasController.edit')
  Route.post('/', 'EmpresasController.create')
  Route.post('/:id', 'EmpresasController.update')
  Route.delete('/:id', 'EmpresasController.delete')
}).prefix('/empresas').middleware('auth')

Route.group(() => {
  Route.get('/', 'NotaFiscalsController.index')
  Route.post('/findBy', 'NotaFiscalsController.findBy')
  Route.post('/deleteAll', 'NotaFiscalsController.deleteAll')
  
}).prefix('/notasFiscais').middleware('auth')

Route.get('/register', 'AuthController.showRegister').middleware('guest')
Route.post('/register', 'AuthController.register')
Route.post('/logout', 'AuthController.logout')
Route.get('/login', 'AuthController.showLogin').middleware('guest')
Route.post('/login', 'AuthController.login')
