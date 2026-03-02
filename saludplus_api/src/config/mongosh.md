🔐 1️⃣ Conexión a MongoDB
mongosh

Con usuario y contraseña:

mongosh -u usuario -p contraseña --authenticationDatabase admin

Con URI (muy común en proyectos):

mongosh "mongodb://localhost:27017"

Con MongoDB Atlas:

mongosh "mongodb+srv://usuario:contraseña@cluster..."
🗄️ 2️⃣ Bases de datos

Ver bases de datos:

show dbs

Ver base actual:

db

Cambiar o crear base de datos:

use nombreBase

Eliminar base de datos:

db.dropDatabase()
📂 3️⃣ Colecciones

Ver colecciones:

show collections

Crear colección:

db.createCollection("nombreColeccion")

Eliminar colección:

db.nombreColeccion.drop()
📄 4️⃣ Documentos (CRUD básico)

Insertar uno:

db.nombre.insertOne({ campo: "valor" })

Insertar varios:

db.nombre.insertMany([{a:1}, {a:2}])

Ver documentos:

db.nombre.find()

Ver con formato legible:

db.nombre.find().pretty()

Buscar específico:

db.nombre.find({ campo: "valor" })

Actualizar uno:

db.nombre.updateOne(
  { campo: "valor" },
  { $set: { campo2: "nuevo" } }
)

Eliminar uno:

db.nombre.deleteOne({ campo: "valor" })
🔎 5️⃣ Información y verificación

Ver versión:

db.version()

Ver estado del servidor:

db.runCommand({ serverStatus: 1 })

Ver base de datos actual con tamaño:

db.stats()

Ver estadísticas de colección:

db.nombre.stats()
👤 6️⃣ Usuarios y seguridad (MUY IMPORTANTE)

Ver usuarios:

show users

Crear usuario:

db.createUser({
  user: "usuario",
  pwd: "contraseña",
  roles: [ { role: "readWrite", db: "nombreBase" } ]
})

Cambiar contraseña:

db.changeUserPassword("usuario", "nuevaContraseña")

Eliminar usuario:

db.dropUser("usuario")
🔐 7️⃣ Roles

Ver roles:

show roles

Asignar rol:

db.grantRolesToUser("usuario", [{ role: "readWrite", db: "nombreBase" }])

Revocar rol:

db.revokeRolesFromUser("usuario", [{ role: "readWrite", db: "nombreBase" }])
⚡ 8️⃣ Índices (rendimiento y seguridad de consultas)

Ver índices:

db.nombre.getIndexes()

Crear índice:

db.nombre.createIndex({ campo: 1 })

Eliminar índice:

db.nombre.dropIndex("nombre_del_indice")
📊 9️⃣ Conexiones activas
db.runCommand({ currentOp: 1 })
🛑 🔟 Salir
exit
🛡️ SI QUIERES NIVEL PROFESIONAL DE VERIFICACIÓN

Estos son los más importantes:

show dbs
show collections
db.stats()
db.nombre.stats()
db.runCommand({ serverStatus: 1 })
show users
db.getUsers()
db.getRoles({ showPrivileges: true })
🎯 Recomendación Real

Si trabajas en proyectos tipo backend:

Guarda como checklist:

PostgreSQL:

\l+
\dt+
\du
\z
SELECT * FROM pg_stat_activity;

MongoDB:

show dbs
show collections
db.stats()
db.runCommand({ serverStatus: 1 })
show users