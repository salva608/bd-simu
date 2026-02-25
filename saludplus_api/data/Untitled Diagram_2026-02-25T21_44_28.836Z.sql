
CREATE TABLE IF NOT EXISTS PATIENTS(
	"id" serial NOT NULL PRIMARY KEY,
	"email" varchar(30) NOT NULL UNIQUE,
	"name" varchar(20) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" varchar(30) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
);


CREATE TABLE IF NOT EXISTS  DOCTORS (
	"id" serial NOT NULL PRIMARY KEY,
	"email" varchar(30) NOT NULL UNIQUE,
	"name" varchar(20) NOT NULL,
	"specialty" varchar(20) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS   INSURANCES  (
	"id" serial NOT NULL PRIMARY KEY,
	"name" varchar(20) NOT NULL UNIQUE,
	"coverage_percentage" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
);


CREATE TABLE IF NOT EXISTS   TREATMENTS  (
	"id" serial NOT NULL PRIMARY KEY,
	"code" int NOT NULL UNIQUE,
	"descript" varchar(20) NOT NULL,
	"cost" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL	
);


CREATE TABLE IF NOT EXISTS   APPOINTMENTS  (
	"id" serial NOT NULL PRIMARY KEY,
	"description" varchar(255) NOT NULL,
	"patients_id" int NOT NULL,
	"doctor_id" int NOT NULL,
	"treatment_id" int NOT NULL,
	"insurance_id" int NOT NULL,
	"appoinment_date" date NOT NULL,
	"treatment_cost" NUMERIC(10,2) NOT NULL,
	"amount_paid" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	FOREIGN KEY("patients_id") REFERENCES PATIENTS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("doctor_id") REFERENCES DOCTORS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("insurance_id") REFERENCES INSURANCES ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("treatment_id") REFERENCES TREATMENTS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);