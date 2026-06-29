package com.personalfinance.nativeapp;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class FinanceDb extends SQLiteOpenHelper {
    public static final String[] TYPES = {"expenses", "incomes", "checksAndDebts"};
    private static final String DB_NAME = "personal_finance_native.db";

    public FinanceDb(Context context) { super(context, DB_NAME, null, 1); }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE records(id TEXT PRIMARY KEY,type TEXT,title TEXT,person TEXT,relation TEXT,amount INTEGER,status TEXT,dueDate TEXT,category TEXT,description TEXT,isCheck INTEGER,bank TEXT,archived INTEGER DEFAULT 0,createdAt TEXT,updatedAt TEXT)");
        db.execSQL("CREATE TABLE financialContacts(id TEXT PRIMARY KEY,title TEXT,mobile TEXT,bank TEXT,account TEXT,card TEXT,iban TEXT,nationalId TEXT,type TEXT,description TEXT)");
        db.execSQL("CREATE TABLE banks(id TEXT PRIMARY KEY,title TEXT)");
        db.execSQL("CREATE TABLE expenseCategories(id TEXT PRIMARY KEY,title TEXT)");
        db.execSQL("CREATE TABLE incomeCategories(id TEXT PRIMARY KEY,title TEXT)");
        db.execSQL("CREATE TABLE tags(id TEXT PRIMARY KEY,title TEXT)");
        db.execSQL("CREATE TABLE appSettings(key TEXT PRIMARY KEY,value TEXT)");
        seed(db);
    }

    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {}

    private void seed(SQLiteDatabase db) {
        addNamed(db, "banks", "بانک شهر"); addNamed(db, "banks", "بانک پاسارگاد");
        for (String value : new String[]{"مسکن","قبوض","بیمه","خرید","حمل‌ونقل"}) addNamed(db, "expenseCategories", value);
        for (String value : new String[]{"حقوق","پروژه","سرمایه‌گذاری","اجاره"}) addNamed(db, "incomeCategories", value);
        for (String value : new String[]{"ثابت","مهم","کاری","ماهانه"}) addNamed(db, "tags", value);
        addRecord(db, "expenses", "اجاره خانه", "", "", 25000000, "پرداخت نشده", date(2), "مسکن", "اجاره ماه جاری", false, "");
        addRecord(db, "expenses", "اینترنت", "", "", 650000, "عقب‌افتاده", date(-4), "قبوض", "", false, "");
        addRecord(db, "expenses", "قسط خودرو", "", "", 12500000, "نزدیک سررسید", date(5), "حمل‌ونقل", "", false, "");
        addRecord(db, "incomes", "حقوق ماهانه", "", "", 48000000, "دریافت شده", date(-2), "حقوق", "", false, "");
        addRecord(db, "incomes", "پروژه طراحی سایت", "", "", 30000000, "دریافت ناقص", date(10), "پروژه", "", false, "");
        addRecord(db, "incomes", "سود سرمایه‌گذاری", "", "", 8000000, "دریافت نشده", date(20), "سرمایه‌گذاری", "", false, "");
        addRecord(db, "checksAndDebts", "چک پرداختنی بانک شهر", "فروشنده خودرو", "پرداختنی", 18000000, "نزدیک سررسید", date(3), "", "", true, "بانک شهر");
        addRecord(db, "checksAndDebts", "چک دریافتی بانک پاسارگاد", "مشتری پروژه", "دریافتنی", 22000000, "فعال", date(8), "", "", true, "بانک پاسارگاد");
        addRecord(db, "checksAndDebts", "طلب دریافتنی از مشتری", "شرکت آفتاب", "دریافتنی", 12500000, "فعال", date(18), "", "", false, "");
        setSetting(db, "currency", "تومان");
    }

    private static String date(int offset) {
        Calendar calendar = Calendar.getInstance(); calendar.add(Calendar.DAY_OF_MONTH, offset);
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(calendar.getTime());
    }

    private void addNamed(SQLiteDatabase db, String table, String title) {
        ContentValues values = new ContentValues(); values.put("id", UUID.randomUUID().toString()); values.put("title", title); db.insert(table, null, values);
    }

    private void addRecord(SQLiteDatabase db, String type, String title, String person, String relation, long amount, String status, String dueDate, String category, String description, boolean isCheck, String bank) {
        ContentValues values = values(type, title, person, relation, amount, status, dueDate, category, description, isCheck, bank);
        db.insert("records", null, values);
    }

    private ContentValues values(String type, String title, String person, String relation, long amount, String status, String dueDate, String category, String description, boolean isCheck, String bank) {
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(new Date());
        ContentValues values = new ContentValues();
        values.put("id", UUID.randomUUID().toString()); values.put("type", type); values.put("title", title); values.put("person", person);
        values.put("relation", relation); values.put("amount", amount); values.put("status", status); values.put("dueDate", dueDate);
        values.put("category", category); values.put("description", description); values.put("isCheck", isCheck ? 1 : 0); values.put("bank", bank);
        values.put("createdAt", now); values.put("updatedAt", now);
        return values;
    }

    public void insertRecord(String type, String title, String person, String relation, long amount, String dueDate, String category, String description, boolean isCheck, String bank) {
        String status = type.equals("expenses") ? "پرداخت نشده" : type.equals("incomes") ? "دریافت نشده" : "فعال";
        getWritableDatabase().insert("records", null, values(type, title, person, relation, amount, status, dueDate, category, description, isCheck, bank));
    }

    public void updateRecord(String id, String title, String person, String relation, long amount, String dueDate, String category, String description, boolean isCheck, String bank) {
        ContentValues values = new ContentValues();
        values.put("title", title); values.put("person", person); values.put("relation", relation); values.put("amount", amount);
        values.put("dueDate", dueDate); values.put("category", category); values.put("description", description);
        values.put("isCheck", isCheck ? 1 : 0); values.put("bank", bank);
        values.put("updatedAt", new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(new Date()));
        getWritableDatabase().update("records", values, "id=?", new String[]{id});
    }

    public List<Record> records(String type, boolean archived) {
        List<Record> result = new ArrayList<>();
        Cursor cursor = getReadableDatabase().query("records", null, "type=? AND archived=?", new String[]{type, archived ? "1" : "0"}, null, null, "dueDate ASC");
        while (cursor.moveToNext()) result.add(Record.from(cursor));
        cursor.close(); return result;
    }

    public void archive(String id, String status) {
        ContentValues values = new ContentValues(); values.put("archived", 1); values.put("status", status); values.put("updatedAt", new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(new Date()));
        getWritableDatabase().update("records", values, "id=?", new String[]{id});
    }

    public void restore(String id) { ContentValues values = new ContentValues(); values.put("archived", 0); getWritableDatabase().update("records", values, "id=?", new String[]{id}); }
    public void delete(String id) { getWritableDatabase().delete("records", "id=?", new String[]{id}); }
    public long sum(String type, boolean archived) {
        Cursor c = getReadableDatabase().rawQuery("SELECT COALESCE(SUM(amount),0) FROM records WHERE type=? AND archived=?", new String[]{type, archived ? "1":"0"});
        c.moveToFirst(); long value=c.getLong(0); c.close(); return value;
    }
    public int alertCount() {
        Cursor c=getReadableDatabase().rawQuery("SELECT COUNT(*) FROM records WHERE type='checksAndDebts' AND archived=0 AND status IN ('نزدیک سررسید','عقب‌افتاده','برگشت‌خورده')",null);
        c.moveToFirst(); int value=c.getInt(0); c.close(); return value;
    }
    public String setting(String key, String fallback) {
        Cursor c=getReadableDatabase().query("appSettings",new String[]{"value"},"key=?",new String[]{key},null,null,null);
        String value=c.moveToFirst()?c.getString(0):fallback; c.close(); return value;
    }
    public void setSetting(SQLiteDatabase db,String key,String value){ ContentValues v=new ContentValues();v.put("key",key);v.put("value",value);db.insertWithOnConflict("appSettings",null,v,SQLiteDatabase.CONFLICT_REPLACE); }
    public void setSetting(String key,String value){setSetting(getWritableDatabase(),key,value);}

    public static class Record {
        public String id,type,title,person,relation,status,dueDate,category,description,bank,createdAt; public long amount; public boolean isCheck;
        static Record from(Cursor c){Record r=new Record();r.id=c.getString(c.getColumnIndexOrThrow("id"));r.type=c.getString(c.getColumnIndexOrThrow("type"));r.title=c.getString(c.getColumnIndexOrThrow("title"));r.person=c.getString(c.getColumnIndexOrThrow("person"));r.relation=c.getString(c.getColumnIndexOrThrow("relation"));r.amount=c.getLong(c.getColumnIndexOrThrow("amount"));r.status=c.getString(c.getColumnIndexOrThrow("status"));r.dueDate=c.getString(c.getColumnIndexOrThrow("dueDate"));r.category=c.getString(c.getColumnIndexOrThrow("category"));r.description=c.getString(c.getColumnIndexOrThrow("description"));r.isCheck=c.getInt(c.getColumnIndexOrThrow("isCheck"))==1;r.bank=c.getString(c.getColumnIndexOrThrow("bank"));r.createdAt=c.getString(c.getColumnIndexOrThrow("createdAt"));return r;}
    }
}
