import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1779371618699 implements MigrationInterface {
  name = 'InitialSchema1779371618699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sedes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nombre\` varchar(100) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`ciudad\` varchar(80) NOT NULL DEFAULT 'Bogotá', \`direccion\` varchar(200) NULL, \`telefono\` varchar(20) NULL, \`activa\` tinyint NOT NULL DEFAULT 1, \`capacidad_carros\` int NOT NULL DEFAULT '0', \`capacidad_motos\` int NOT NULL DEFAULT '0', \`capacidad_bicis\` int NOT NULL DEFAULT '0', \`aplica_pico_placa\` tinyint NOT NULL DEFAULT 0, \`notas\` text NULL, UNIQUE INDEX \`IDX_518e95904db7c26167b8c71986\` (\`nombre\`), UNIQUE INDEX \`IDX_20009471d2f52ec388721d6fa1\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ubicaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`sede_id\` int NOT NULL, \`nombre\` varchar(100) NOT NULL, \`codigo\` varchar(20) NULL, \`tipo\` varchar(50) NOT NULL DEFAULT 'GENERAL', \`activa\` tinyint NOT NULL DEFAULT 1, \`descripcion\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`personas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`tipo_documento\` enum ('CC', 'CE', 'PASAPORTE', 'TI', 'NIT') NOT NULL, \`numero_documento\` varchar(30) NOT NULL, \`nombres\` varchar(100) NOT NULL, \`apellidos\` varchar(100) NOT NULL, \`email\` varchar(150) NULL, \`telefono_celular\` varchar(20) NULL, \`ciudad_operacion\` varchar(80) NULL, \`direccion_domicilio\` varchar(200) NULL, \`es_extranjero\` tinyint NOT NULL DEFAULT 0, \`fecha_nacimiento\` date NULL, \`tratamiento_datos\` tinyint NOT NULL DEFAULT 0, \`proveedor_id\` int NULL, \`tipologia_hse\` enum ('CONTRATISTA_EMPRESA', 'TECNICO_INDEPENDIENTE', 'PROVEEDOR_SERVICIOS', 'INSPECTOR_AUDITOR', 'FUNCIONARIO_PUBLICO') NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`notas\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`proveedores\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nom_proveedor\` varchar(200) NOT NULL, \`nit_proveedor\` varchar(20) NOT NULL, \`tipo_identificacion_prov\` enum ('NIT', 'CC', 'CE', 'PASAPORTE') NULL, \`estado_prov\` tinyint NOT NULL DEFAULT 1, \`direccion_prov\` varchar(200) NULL, \`telefono_prov\` varchar(20) NULL, \`email_contacto\` varchar(150) NULL, \`ciudad\` varchar(80) NULL, \`tratamiento_datos\` tinyint NOT NULL DEFAULT 0, \`notas\` text NULL, UNIQUE INDEX \`IDX_a70ad9be543f1ec5f2be2a6a1f\` (\`nit_proveedor\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cat_roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nombre\` enum ('ADMIN_GLOBAL', 'ADMIN_PARKING', 'ADMIN_HSE', 'GESTION_HSE', 'ADMIN_NFC', 'ADMIN_GH', 'VIGILANTE_HSE', 'VIGILANTE_PARKING', 'VISUALIZADOR') NOT NULL, \`descripcion\` varchar(255) NULL, \`activo\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_a2f906abdd76bb81c61b734904\` (\`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario_roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`usuario_id\` int NOT NULL, \`rol_id\` int NOT NULL, \`asignado_por\` int NULL, UNIQUE INDEX \`uq_usuario_rol\` (\`usuario_id\`, \`rol_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`refresh_tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`usuario_id\` int NOT NULL, \`jti\` varchar(36) NOT NULL, \`revocado\` tinyint NOT NULL DEFAULT 0, \`expira_en\` datetime NOT NULL, \`user_agent\` text NULL, \`ip_address\` varchar(45) NULL, UNIQUE INDEX \`IDX_f3752400c98d5c0b3dca54d66d\` (\`jti\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`perfiles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`usuario_id\` int NOT NULL, \`foto_perfil\` varchar(500) NULL, \`biografia\` text NULL, \`ubicacion\` varchar(150) NULL, \`telefono\` varchar(20) NULL, \`sede_default_id\` int NULL, \`tema\` varchar(20) NOT NULL DEFAULT 'dark', \`notificaciones_email\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_f1ba88813b103ae277538c3fdd\` (\`usuario_id\`), UNIQUE INDEX \`REL_f1ba88813b103ae277538c3fdd\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario_permisos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`usuario_id\` int NOT NULL, \`puede_ver\` tinyint NOT NULL DEFAULT 1, \`puede_crear\` tinyint NOT NULL DEFAULT 0, \`puede_editar\` tinyint NOT NULL DEFAULT 0, \`puede_eliminar\` tinyint NOT NULL DEFAULT 0, \`asignado_por\` int NULL, UNIQUE INDEX \`IDX_e62cb45e771719fa20c9171c4c\` (\`usuario_id\`), UNIQUE INDEX \`uq_usuario_permisos_unico\` (\`usuario_id\`), UNIQUE INDEX \`REL_e62cb45e771719fa20c9171c4c\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario_sedes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`usuario_id\` int NOT NULL, \`sede_id\` int NOT NULL, UNIQUE INDEX \`uq_usuario_sede\` (\`usuario_id\`, \`sede_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`email\` varchar(150) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`nombre_completo\` varchar(150) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`debe_cambiar_password\` tinyint NOT NULL DEFAULT 1, \`ultimo_login\` datetime NULL, \`intentos_fallidos\` int NOT NULL DEFAULT '0', \`bloqueado_hasta\` datetime NULL, \`sede_asignada_id\` int NULL, UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_excepciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`persona_id\` int NULL, \`tipo_documento\` varchar(20) NULL, \`numero_documento\` varchar(30) NULL, \`nombre_completo\` varchar(200) NULL, \`proveedor_id\` int NULL, \`origen_excepcion\` varchar(20) NOT NULL DEFAULT 'INDIVIDUAL', \`ubicacion_id\` int NULL, \`aprobado_por\` int NOT NULL, \`sede_id\` int NOT NULL, \`motivo\` text NOT NULL, \`fecha_inicio\` date NOT NULL, \`fecha_fin\` date NOT NULL, \`activa\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_autorizaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`codigo\` varchar(20) NOT NULL COMMENT 'HSE-2026-XXXX — generado automáticamente', \`proveedor_id\` int NULL, \`sede_id\` int NOT NULL, \`creado_por\` int NOT NULL, \`responsable_interno_id\` int NULL, \`tipo_contratista\` enum ('ALTO_RIESGO', 'NORMAL') NOT NULL, \`descripcion_actividad\` text NOT NULL, \`fecha_inicio\` date NOT NULL, \`fecha_fin\` date NOT NULL, \`estado\` enum ('BORRADOR', 'PENDIENTE_AUTOGESTION', 'EN_REVISION', 'APROBADO', 'DENEGADO', 'VENCIDO') NOT NULL DEFAULT 'BORRADOR', \`motivo_denegacion\` text NULL, UNIQUE INDEX \`IDX_314fd4184432019106e263058c\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_clasificacion_actividad\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`trabajo_alturas\` tinyint NOT NULL DEFAULT 0, \`espacios_confinados\` tinyint NOT NULL DEFAULT 0, \`trabajo_electrico\` tinyint NOT NULL DEFAULT 0, \`trabajo_caliente\` tinyint NOT NULL DEFAULT 0, \`izaje_maquinaria\` tinyint NOT NULL DEFAULT 0, \`visita_sin_riesgo\` tinyint NOT NULL DEFAULT 0, \`personal_extranjero\` tinyint NOT NULL DEFAULT 0, \`genera_residuos\` tinyint NOT NULL DEFAULT 0, \`alturas_nivel\` enum ('BASICO', 'AVANZADO', 'COORDINADOR') NULL, \`alturas_cert_fecha_venc\` date NULL, \`alturas_cert_archivo\` varchar(500) NULL, \`confinados_rol\` enum ('SUPERVISOR', 'VIGIA', 'ENTRANTE') NULL, \`confinados_cert_fecha\` date NULL, \`confinados_cert_archivo\` varchar(500) NULL, \`electrico_matricula_contec\` enum ('TE1', 'TE2', 'TE3', 'TE4', 'TE5', 'TE6') NULL, \`electrico_num_matricula\` varchar(50) NULL, \`electrico_matricula_venc\` date NULL, \`electrico_matricula_archivo\` varchar(500) NULL, \`caliente_extintor_fecha\` date NULL, \`caliente_extintor_archivo\` varchar(500) NULL, \`caliente_permiso_fecha\` date NULL, \`caliente_permiso_archivo\` varchar(500) NULL, \`izaje_tipo_equipo\` varchar(100) NULL, \`izaje_inspeccion_archivo\` varchar(500) NULL, \`izaje_doc_legal_archivo\` varchar(500) NULL, \`izaje_licencia_archivo\` varchar(500) NULL, \`extran_aseguradora\` varchar(150) NULL, \`extran_num_poliza\` varchar(100) NULL, \`extran_poliza_venc\` date NULL, \`extran_poliza_archivo\` varchar(500) NULL, \`residuos_tipo\` varchar(200) NULL, \`residuos_plan_archivo\` varchar(500) NULL, UNIQUE INDEX \`IDX_d3a1d7a480420118caa61c85e3\` (\`contratista_id\`), UNIQUE INDEX \`REL_d3a1d7a480420118caa61c85e3\` (\`contratista_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cat_eps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nombre\` varchar(150) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`activa\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_f132ba4c80004b012d3cbcb3b6\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cat_arl\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nombre\` varchar(150) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`activa\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_30d98e25786db7f5a1d68b693b\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cat_afp\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`nombre\` varchar(150) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`activa\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_b0aa79843144260a67eb93fba1\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_seguridad_social\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`es_titular\` tinyint NOT NULL DEFAULT 1, \`nombre_persona\` varchar(150) NULL, \`cedula_persona\` varchar(30) NULL, \`eps_id\` int NULL, \`eps_vigencia\` date NULL, \`arl_id\` int NULL, \`arl_vigencia\` date NULL, \`afp_id\` int NULL, \`afp_vigencia\` date NULL, \`pila_tipo\` enum ('INTEGRADA', 'MANUAL', 'NO_APLICA') NULL, \`pila_estado\` enum ('PENDIENTE', 'PAGADA', 'VENCIDA') NULL, \`pila_archivo\` varchar(500) NULL, \`sst_tiene_vigente\` tinyint NOT NULL DEFAULT 0, \`sst_responsable_nombre\` varchar(150) NULL, \`sst_resolucion_registro\` varchar(100) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_certificaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`art_descripcion_tarea\` text NULL, \`art_archivo\` varchar(500) NULL, \`permiso_tipo\` enum ('ALTURAS', 'CONFINADOS', 'CALIENTE', 'ELECTRICO', 'GENERAL') NULL, \`permiso_fecha\` date NULL, \`permiso_archivo\` varchar(500) NULL, UNIQUE INDEX \`IDX_c1074baf60e24fb7a4b0dbfd80\` (\`contratista_id\`), UNIQUE INDEX \`REL_c1074baf60e24fb7a4b0dbfd80\` (\`contratista_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_contacto_emergencia\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`nombre_completo\` varchar(150) NOT NULL, \`relacion\` enum ('FAMILIAR', 'CONYUGE', 'COLEGA', 'OTRO') NOT NULL, \`relacion_otro\` varchar(80) NULL, \`telefono_celular\` varchar(20) NOT NULL, \`telefono_fijo\` varchar(20) NULL, \`rh_sanguineo\` enum ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG') NULL, \`alergias\` text NULL, \`condicion_medica\` text NULL, \`eps_contratista\` varchar(100) NULL, UNIQUE INDEX \`IDX_d90e06e54c7cfaa804140c50b2\` (\`contratista_id\`), UNIQUE INDEX \`REL_d90e06e54c7cfaa804140c50b2\` (\`contratista_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_aceptacion_normas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`acepto_normas\` tinyint NOT NULL DEFAULT 0, \`acepto_datos\` tinyint NOT NULL DEFAULT 0, \`firma_digital\` varchar(200) NULL, \`fecha_aceptacion\` datetime NULL, \`ip_address\` varchar(45) NULL, UNIQUE INDEX \`IDX_dbcf6cfe79c7211540b134a8cc\` (\`contratista_id\`), UNIQUE INDEX \`REL_dbcf6cfe79c7211540b134a8cc\` (\`contratista_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_accesos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`sede_id\` int NOT NULL, \`registrado_por\` int NOT NULL, \`tipo\` varchar(20) NOT NULL COMMENT 'ENTRADA / SALIDA', \`metodo\` enum ('CEDULA_MANUAL', 'LECTOR_USB', 'MANUAL_VIGILANTE') NOT NULL DEFAULT 'CEDULA_MANUAL', \`ubicacion_id\` int NULL, \`observacion\` text NULL, \`fecha_hora\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_cumplimiento_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`cumplimiento_id\` int NOT NULL, \`pregunta\` varchar(300) NOT NULL, \`aplica\` tinyint NOT NULL DEFAULT 1, \`cumple\` tinyint NULL, \`observacion\` text NULL, \`orden\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_cumplimiento\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`sede_id\` int NOT NULL, \`encargado_id\` int NOT NULL, \`estado\` enum ('EN_PROGRESO', 'COMPLETADO', 'INCUMPLIMIENTO') NOT NULL DEFAULT 'EN_PROGRESO', \`observacion_general\` text NULL, \`fecha_inicio\` datetime NOT NULL, \`fecha_cierre\` datetime NULL, \`firma_digital\` varchar(200) NULL, \`archivado\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_historial_estados\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`usuario_id\` int NULL, \`estado_anterior\` varchar(50) NULL, \`estado_nuevo\` varchar(50) NOT NULL, \`motivo\` text NULL, \`metadata_extra\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_contratistas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`autorizacion_id\` int NOT NULL, \`persona_id\` int NULL COMMENT 'Se vincula cuando la persona ya existe en BD', \`tipo_documento\` enum ('CC', 'CE', 'PASAPORTE', 'TI') NOT NULL, \`numero_documento\` varchar(30) NOT NULL, \`nombres\` varchar(100) NOT NULL, \`apellidos\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`telefono\` varchar(20) NULL, \`es_extranjero\` tinyint NOT NULL DEFAULT 0, \`estado\` enum ('PENDIENTE_AUTOGESTION', 'AUTOGESTION_EN_PROGRESO', 'AUTOGESTION_COMPLETADA', 'EN_REVISION', 'APROBADO', 'DENEGADO') NOT NULL DEFAULT 'PENDIENTE_AUTOGESTION', \`motivo_denegacion\` text NULL, \`token_autogestion\` varchar(64) NULL, \`token_expira_en\` datetime NULL, \`token_duracion_horas\` int NULL COMMENT '24, 48, 72 o personalizado', \`autogestion_completada_en\` datetime NULL, \`sst_responsable_nombre\` varchar(150) NULL, \`sst_responsable_telefono\` varchar(20) NULL, UNIQUE INDEX \`IDX_ed1f8090c00f2ba0baa6e796c4\` (\`token_autogestion\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`hse_examen_medico\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`contratista_id\` int NOT NULL, \`fecha_examen\` date NULL, \`concepto\` enum ('APTO', 'APTO_CON_RESTRICCION', 'NO_APTO', 'PENDIENTE') NULL, \`descripcion_restriccion\` text NULL, \`archivo\` varchar(500) NULL, UNIQUE INDEX \`IDX_0f2d11262b16c2e8e0e579f641\` (\`contratista_id\`), UNIQUE INDEX \`REL_0f2d11262b16c2e8e0e579f641\` (\`contratista_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cat_normas_seguridad\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`numero\` int NOT NULL COMMENT 'Orden de lectura', \`titulo\` varchar(200) NOT NULL, \`contenido\` text NOT NULL, \`activa\` tinyint NOT NULL DEFAULT 1, \`sede_id\` int NULL COMMENT 'NULL = aplica a todas las sedes', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`config_tiempos_contratista\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`tipo_contratista\` enum ('NORMAL', 'ALTO_RIESGO', 'EXCEPCION') NOT NULL, \`token_duracion_horas\` int NOT NULL DEFAULT '72', \`autorizacion_duracion_dias\` int NOT NULL DEFAULT '30', \`alerta_vencimiento_dias\` int NOT NULL DEFAULT '3', \`requiere_examen_medico\` tinyint NOT NULL DEFAULT 0, \`requiere_seguridad_social\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_0489d9e631b85887ba088fb926\` (\`tipo_contratista\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`audit_log\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL COMMENT 'Fecha de creación del registro — se llena automáticamente' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Fecha de última modificación — se actualiza automáticamente' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Soft delete — NULL = activo, fecha = eliminado lógicamente', \`actor_id\` int NULL, \`actor_nombre\` varchar(150) NOT NULL, \`accion\` varchar(50) NOT NULL, \`entidad\` varchar(50) NOT NULL, \`entidad_id\` int NULL, \`descripcion\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ubicaciones\` ADD CONSTRAINT \`FK_96934ad706b8e3008904e473f8d\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` ADD CONSTRAINT \`FK_7c9c327f433cee60f24cdca970f\` FOREIGN KEY (\`proveedor_id\`) REFERENCES \`proveedores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_roles\` ADD CONSTRAINT \`FK_f4660653ecea0eef621bae52097\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_roles\` ADD CONSTRAINT \`FK_0a60de73dab09515692949c13a5\` FOREIGN KEY (\`rol_id\`) REFERENCES \`cat_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_c8349fdadc1bc791125bdd8c855\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles\` ADD CONSTRAINT \`FK_f1ba88813b103ae277538c3fdd8\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_permisos\` ADD CONSTRAINT \`FK_e62cb45e771719fa20c9171c4c2\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_sedes\` ADD CONSTRAINT \`FK_9945c4b3856c3a060f3fb9dace9\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_sedes\` ADD CONSTRAINT \`FK_803ab5cf59070b5d0fe6179a522\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_143e9c2ed1643be5f8b42f796c3\` FOREIGN KEY (\`sede_asignada_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` ADD CONSTRAINT \`FK_da2d29e40e70aa7877e464e4032\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` ADD CONSTRAINT \`FK_963ed5d90f74de76fd2222b65d3\` FOREIGN KEY (\`aprobado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` ADD CONSTRAINT \`FK_9b3c7e1018cf4cacaf851e37eba\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` ADD CONSTRAINT \`FK_e72190615aafc19e0a410c4fd59\` FOREIGN KEY (\`proveedor_id\`) REFERENCES \`proveedores\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` ADD CONSTRAINT \`FK_33c32e9028cf437d752042552dd\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` ADD CONSTRAINT \`FK_d6374111efd2444995715c34737\` FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` ADD CONSTRAINT \`FK_d5908ce6c43d88b5d57bbace111\` FOREIGN KEY (\`responsable_interno_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_clasificacion_actividad\` ADD CONSTRAINT \`FK_d3a1d7a480420118caa61c85e3e\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` ADD CONSTRAINT \`FK_a85998483a7434b337f3d1704e0\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` ADD CONSTRAINT \`FK_9ade04019a403daf794968af254\` FOREIGN KEY (\`eps_id\`) REFERENCES \`cat_eps\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` ADD CONSTRAINT \`FK_9bbfe51c1b3f345d03b1f98580c\` FOREIGN KEY (\`arl_id\`) REFERENCES \`cat_arl\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` ADD CONSTRAINT \`FK_26f01472c9fc53a0c3d17c14ca1\` FOREIGN KEY (\`afp_id\`) REFERENCES \`cat_afp\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_certificaciones\` ADD CONSTRAINT \`FK_c1074baf60e24fb7a4b0dbfd805\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contacto_emergencia\` ADD CONSTRAINT \`FK_d90e06e54c7cfaa804140c50b2c\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_aceptacion_normas\` ADD CONSTRAINT \`FK_dbcf6cfe79c7211540b134a8cce\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` ADD CONSTRAINT \`FK_847b061b5a950867d7706ba95cb\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` ADD CONSTRAINT \`FK_2b9ffd51e08274b57ef0458223c\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` ADD CONSTRAINT \`FK_bdd5b81eb6f5f607e4ae5493d26\` FOREIGN KEY (\`registrado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` ADD CONSTRAINT \`FK_27189aa84da56ab6926b3d30ca0\` FOREIGN KEY (\`ubicacion_id\`) REFERENCES \`ubicaciones\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento_items\` ADD CONSTRAINT \`FK_7cfe82c0da754cd5dc27be15c9e\` FOREIGN KEY (\`cumplimiento_id\`) REFERENCES \`hse_cumplimiento\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` ADD CONSTRAINT \`FK_cec1914e5c4b288070b595ffcea\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` ADD CONSTRAINT \`FK_d2d5cf848a3b437f55484a9e54e\` FOREIGN KEY (\`encargado_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` ADD CONSTRAINT \`FK_3391bca9cb7c8ee9aca1eb8e2ad\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_historial_estados\` ADD CONSTRAINT \`FK_c5e8c86ccc0552a123da75e8cd5\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_historial_estados\` ADD CONSTRAINT \`FK_b9af10972281db23e1dce2df0fb\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contratistas\` ADD CONSTRAINT \`FK_73450c6c67b01e0147decd956aa\` FOREIGN KEY (\`autorizacion_id\`) REFERENCES \`hse_autorizaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contratistas\` ADD CONSTRAINT \`FK_0c3025ba548b951b03ff3a7d47d\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_examen_medico\` ADD CONSTRAINT \`FK_0f2d11262b16c2e8e0e579f641b\` FOREIGN KEY (\`contratista_id\`) REFERENCES \`hse_contratistas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cat_normas_seguridad\` ADD CONSTRAINT \`FK_8d8d0326fcfc8623529e622bc8f\` FOREIGN KEY (\`sede_id\`) REFERENCES \`sedes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`cat_normas_seguridad\` DROP FOREIGN KEY \`FK_8d8d0326fcfc8623529e622bc8f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_examen_medico\` DROP FOREIGN KEY \`FK_0f2d11262b16c2e8e0e579f641b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contratistas\` DROP FOREIGN KEY \`FK_0c3025ba548b951b03ff3a7d47d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contratistas\` DROP FOREIGN KEY \`FK_73450c6c67b01e0147decd956aa\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_historial_estados\` DROP FOREIGN KEY \`FK_b9af10972281db23e1dce2df0fb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_historial_estados\` DROP FOREIGN KEY \`FK_c5e8c86ccc0552a123da75e8cd5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` DROP FOREIGN KEY \`FK_3391bca9cb7c8ee9aca1eb8e2ad\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` DROP FOREIGN KEY \`FK_d2d5cf848a3b437f55484a9e54e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento\` DROP FOREIGN KEY \`FK_cec1914e5c4b288070b595ffcea\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_cumplimiento_items\` DROP FOREIGN KEY \`FK_7cfe82c0da754cd5dc27be15c9e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` DROP FOREIGN KEY \`FK_27189aa84da56ab6926b3d30ca0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` DROP FOREIGN KEY \`FK_bdd5b81eb6f5f607e4ae5493d26\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` DROP FOREIGN KEY \`FK_2b9ffd51e08274b57ef0458223c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_accesos\` DROP FOREIGN KEY \`FK_847b061b5a950867d7706ba95cb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_aceptacion_normas\` DROP FOREIGN KEY \`FK_dbcf6cfe79c7211540b134a8cce\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_contacto_emergencia\` DROP FOREIGN KEY \`FK_d90e06e54c7cfaa804140c50b2c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_certificaciones\` DROP FOREIGN KEY \`FK_c1074baf60e24fb7a4b0dbfd805\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` DROP FOREIGN KEY \`FK_26f01472c9fc53a0c3d17c14ca1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` DROP FOREIGN KEY \`FK_9bbfe51c1b3f345d03b1f98580c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` DROP FOREIGN KEY \`FK_9ade04019a403daf794968af254\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_seguridad_social\` DROP FOREIGN KEY \`FK_a85998483a7434b337f3d1704e0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_clasificacion_actividad\` DROP FOREIGN KEY \`FK_d3a1d7a480420118caa61c85e3e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` DROP FOREIGN KEY \`FK_d5908ce6c43d88b5d57bbace111\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` DROP FOREIGN KEY \`FK_d6374111efd2444995715c34737\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` DROP FOREIGN KEY \`FK_33c32e9028cf437d752042552dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_autorizaciones\` DROP FOREIGN KEY \`FK_e72190615aafc19e0a410c4fd59\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` DROP FOREIGN KEY \`FK_9b3c7e1018cf4cacaf851e37eba\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` DROP FOREIGN KEY \`FK_963ed5d90f74de76fd2222b65d3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`hse_excepciones\` DROP FOREIGN KEY \`FK_da2d29e40e70aa7877e464e4032\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_143e9c2ed1643be5f8b42f796c3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_sedes\` DROP FOREIGN KEY \`FK_803ab5cf59070b5d0fe6179a522\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_sedes\` DROP FOREIGN KEY \`FK_9945c4b3856c3a060f3fb9dace9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_permisos\` DROP FOREIGN KEY \`FK_e62cb45e771719fa20c9171c4c2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles\` DROP FOREIGN KEY \`FK_f1ba88813b103ae277538c3fdd8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_c8349fdadc1bc791125bdd8c855\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_roles\` DROP FOREIGN KEY \`FK_0a60de73dab09515692949c13a5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_roles\` DROP FOREIGN KEY \`FK_f4660653ecea0eef621bae52097\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` DROP FOREIGN KEY \`FK_7c9c327f433cee60f24cdca970f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ubicaciones\` DROP FOREIGN KEY \`FK_96934ad706b8e3008904e473f8d\``,
    );
    await queryRunner.query(`DROP TABLE \`audit_log\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0489d9e631b85887ba088fb926\` ON \`config_tiempos_contratista\``,
    );
    await queryRunner.query(`DROP TABLE \`config_tiempos_contratista\``);
    await queryRunner.query(`DROP TABLE \`cat_normas_seguridad\``);
    await queryRunner.query(
      `DROP INDEX \`REL_0f2d11262b16c2e8e0e579f641\` ON \`hse_examen_medico\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0f2d11262b16c2e8e0e579f641\` ON \`hse_examen_medico\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_examen_medico\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ed1f8090c00f2ba0baa6e796c4\` ON \`hse_contratistas\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_contratistas\``);
    await queryRunner.query(`DROP TABLE \`hse_historial_estados\``);
    await queryRunner.query(`DROP TABLE \`hse_cumplimiento\``);
    await queryRunner.query(`DROP TABLE \`hse_cumplimiento_items\``);
    await queryRunner.query(`DROP TABLE \`hse_accesos\``);
    await queryRunner.query(
      `DROP INDEX \`REL_dbcf6cfe79c7211540b134a8cc\` ON \`hse_aceptacion_normas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_dbcf6cfe79c7211540b134a8cc\` ON \`hse_aceptacion_normas\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_aceptacion_normas\``);
    await queryRunner.query(
      `DROP INDEX \`REL_d90e06e54c7cfaa804140c50b2\` ON \`hse_contacto_emergencia\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d90e06e54c7cfaa804140c50b2\` ON \`hse_contacto_emergencia\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_contacto_emergencia\``);
    await queryRunner.query(
      `DROP INDEX \`REL_c1074baf60e24fb7a4b0dbfd80\` ON \`hse_certificaciones\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c1074baf60e24fb7a4b0dbfd80\` ON \`hse_certificaciones\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_certificaciones\``);
    await queryRunner.query(`DROP TABLE \`hse_seguridad_social\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b0aa79843144260a67eb93fba1\` ON \`cat_afp\``,
    );
    await queryRunner.query(`DROP TABLE \`cat_afp\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_30d98e25786db7f5a1d68b693b\` ON \`cat_arl\``,
    );
    await queryRunner.query(`DROP TABLE \`cat_arl\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f132ba4c80004b012d3cbcb3b6\` ON \`cat_eps\``,
    );
    await queryRunner.query(`DROP TABLE \`cat_eps\``);
    await queryRunner.query(
      `DROP INDEX \`REL_d3a1d7a480420118caa61c85e3\` ON \`hse_clasificacion_actividad\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d3a1d7a480420118caa61c85e3\` ON \`hse_clasificacion_actividad\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_clasificacion_actividad\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_314fd4184432019106e263058c\` ON \`hse_autorizaciones\``,
    );
    await queryRunner.query(`DROP TABLE \`hse_autorizaciones\``);
    await queryRunner.query(`DROP TABLE \`hse_excepciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
    await queryRunner.query(
      `DROP INDEX \`uq_usuario_sede\` ON \`usuario_sedes\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario_sedes\``);
    await queryRunner.query(
      `DROP INDEX \`REL_e62cb45e771719fa20c9171c4c\` ON \`usuario_permisos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`uq_usuario_permisos_unico\` ON \`usuario_permisos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e62cb45e771719fa20c9171c4c\` ON \`usuario_permisos\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario_permisos\``);
    await queryRunner.query(
      `DROP INDEX \`REL_f1ba88813b103ae277538c3fdd\` ON \`perfiles\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f1ba88813b103ae277538c3fdd\` ON \`perfiles\``,
    );
    await queryRunner.query(`DROP TABLE \`perfiles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f3752400c98d5c0b3dca54d66d\` ON \`refresh_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
    await queryRunner.query(
      `DROP INDEX \`uq_usuario_rol\` ON \`usuario_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a2f906abdd76bb81c61b734904\` ON \`cat_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`cat_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a70ad9be543f1ec5f2be2a6a1f\` ON \`proveedores\``,
    );
    await queryRunner.query(`DROP TABLE \`proveedores\``);
    await queryRunner.query(`DROP TABLE \`personas\``);
    await queryRunner.query(`DROP TABLE \`ubicaciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_20009471d2f52ec388721d6fa1\` ON \`sedes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_518e95904db7c26167b8c71986\` ON \`sedes\``,
    );
    await queryRunner.query(`DROP TABLE \`sedes\``);
  }
}
