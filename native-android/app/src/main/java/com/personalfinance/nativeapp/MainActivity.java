package com.personalfinance.nativeapp;

import android.app.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import java.text.NumberFormat;
import java.util.*;

public class MainActivity extends Activity {
    private final int BRAND=Color.rgb(23,107,91), BRAND_DARK=Color.rgb(14,77,66), BG=Color.rgb(246,248,247);
    private final int INK=Color.rgb(23,43,39), MUTED=Color.rgb(116,132,127), LINE=Color.rgb(228,235,232);
    private final int GREEN=Color.rgb(32,164,119), RED=Color.rgb(219,98,92), AMBER=Color.rgb(227,163,49);
    private FinanceDb db; private LinearLayout content, nav, root; private String page="dashboard"; private final Handler handler=new Handler();
    private Runnable pendingAction; private View undoBar;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state); db=new FinanceDb(this);
        getWindow().setStatusBarColor(BG); getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        buildShell(); showDashboard();
    }

    private void buildShell() {
        root=column(); root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL); root.setBackgroundColor(BG);
        ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true); scroll.setClipToPadding(false);
        content=column(); content.setPadding(dp(16),dp(18),dp(16),dp(96)); scroll.addView(content);
        root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        nav=new LinearLayout(this); nav.setGravity(Gravity.CENTER); nav.setPadding(dp(2),dp(5),dp(2),dp(5)); nav.setBackgroundColor(Color.WHITE); nav.setElevation(dp(12));
        root.addView(nav,new LinearLayout.LayoutParams(-1,dp(70))); setContentView(root); buildNav();
    }

    private void buildNav() {
        nav.removeAllViews();
        addNav("▦","گزارش وضعیت","dashboard"); addNav("▤","هزینه‌ها","expenses"); addNav("▱","درآمدها","incomes");
        addNav("♜","چک و بدهی"+(db.alertCount()>0?"  "+db.alertCount():""),"checksAndDebts"); addNav("⚙","تنظیمات","settings");
    }

    private void addNav(String icon,String label,String id) {
        LinearLayout item=column(); item.setGravity(Gravity.CENTER); item.setPadding(dp(2),dp(3),dp(2),dp(2)); item.setBackground(page.equals(id)?round(Color.rgb(229,244,239),12):round(Color.TRANSPARENT,12));
        item.addView(centerText(icon,20,page.equals(id)?BRAND:MUTED,true)); item.addView(centerText(label,9,page.equals(id)?BRAND:MUTED,page.equals(id))); item.setOnClickListener(v->navigate(id));
        nav.addView(item,new LinearLayout.LayoutParams(0,-1,1));
    }

    private void navigate(String id){page=id;buildNav();if(id.equals("dashboard"))showDashboard();else if(id.equals("settings"))showSettings();else showRecords(id,false);}

    private void header(String eyebrow,String title,String subtitle,boolean add,View.OnClickListener history) {
        content.removeAllViews();
        LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout labels=column(); labels.addView(text(eyebrow,10,BRAND,true)); labels.addView(text(title,20,INK,true)); labels.addView(text(subtitle,10,MUTED,false)); row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
        if(history!=null){Button h=iconButton("↶",MUTED,Color.WHITE);h.setOnClickListener(history);row.addView(h,margin(dp(44),dp(44),5,0,0,0));}
        if(add){Button a=button("+  افزودن",Color.WHITE,BRAND);a.setTextSize(12);a.setOnClickListener(v->showRecordForm(page,null));row.addView(a,margin(-2,dp(44),7,0,0,0));}
        content.addView(row,margin(-1,-2,0,0,0,18));
    }

    private void showDashboard() {
        page="dashboard";buildNav();header("مدیریت مالی شخصی","سلام، روز خوبی داشته باشید","وضعیت حساب‌های شما در یک نگاه",false,null);
        long income=db.sum("incomes",false), expense=db.sum("expenses",false), debts=db.sum("checksAndDebts",false);
        LinearLayout hero=column(); hero.setPadding(dp(18),dp(18),dp(18),dp(18)); hero.setBackground(gradient(BRAND_DARK,BRAND,22));hero.setElevation(dp(8));
        hero.addView(text("جریان نقدی ماه جاری",11,Color.rgb(216,238,233),false)); hero.addView(text(money(income-expense),24,Color.WHITE,true)); hero.addView(text("درآمد منهای هزینه‌های فعال",10,Color.rgb(216,238,233),false));
        content.addView(hero,margin(-1,dp(136),0,0,0,12));
        LinearLayout alerts=new LinearLayout(this);alerts.addView(alertCard("⚠","آیتم عقب‌افتاده",0),new LinearLayout.LayoutParams(0,dp(72),1));alerts.addView(alertCard("◴","چک نزدیک سررسید",db.alertCount()),new LinearLayout.LayoutParams(0,dp(72),1));content.addView(alerts,margin(-1,-2,0,0,0,20));
        LinearLayout section=between();section.addView(text("خلاصه ماه جاری",17,INK,true));section.addView(chip("به‌روز",BRAND,Color.rgb(232,244,240)));content.addView(section);content.addView(text("بر اساس اطلاعات ثبت‌شده",10,MUTED,false),margin(-1,-2,0,0,0,10));
        addStatRow("درآمد دریافت‌شده",income,GREEN,"مجموع درآمد ماه جاری",income,BRAND);
        addStatRow("هزینه پرداخت‌شده",0,Color.rgb(109,125,120),"مجموع هزینه ماه جاری",expense,RED);
        addStatRow("بدهی‌های پرداختنی",debts,RED,"طلب‌های دریافتنی",debts,GREEN);
        LinearLayout forecast=column();forecast.setPadding(dp(15),dp(13),dp(15),dp(13));forecast.setBackground(round(Color.WHITE,18));forecast.setElevation(dp(3));forecast.addView(text("پیش‌بینی 30 روز آینده",11,MUTED,false));forecast.addView(text(money(income-expense),16,(income-expense)>=0?GREEN:RED,true));content.addView(forecast,margin(-1,-2,0,2,0,0));
    }

    private View alertCard(String icon,String label,int count){LinearLayout card=new LinearLayout(this);card.setGravity(Gravity.CENTER_VERTICAL);card.setPadding(dp(12),dp(10),dp(12),dp(10));card.setBackground(round(Color.WHITE,16));card.setElevation(dp(3));card.addView(text(icon,20,AMBER,false));LinearLayout labels=column();labels.addView(text(label,10,MUTED,false));labels.addView(text(String.valueOf(count),18,INK,true));card.addView(labels,new LinearLayout.LayoutParams(0,-2,1));card.setLayoutParams(margin(0,dp(72),5,0,5,0));return card;}
    private void addStatRow(String a,long av,int ac,String b,long bv,int bc){LinearLayout row=new LinearLayout(this);row.addView(stat(a,av,ac),new LinearLayout.LayoutParams(0,dp(144),1));row.addView(stat(b,bv,bc),new LinearLayout.LayoutParams(0,dp(144),1));content.addView(row,margin(-1,-2,0,0,0,10));}
    private View stat(String label,long value,int color){LinearLayout card=column();card.setPadding(dp(14),dp(14),dp(14),dp(12));card.setBackground(round(Color.WHITE,18));card.setElevation(dp(4));TextView icon=centerText("⌁",19,color,true);icon.setBackground(round(withAlpha(color,28),10));card.addView(icon,new LinearLayout.LayoutParams(dp(34),dp(34)));card.addView(text(label,10,MUTED,false),margin(-1,-2,0,9,0,0));card.addView(text(money(value),14,INK,true));ProgressBar bar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);bar.setProgress(value>0?80:3);bar.setProgressTintList(android.content.res.ColorStateList.valueOf(color));card.addView(bar,margin(-1,dp(5),0,10,0,0));card.setLayoutParams(margin(0,dp(144),5,0,5,0));return card;}

    private void showRecords(String type,boolean archived) {
        page=type;buildNav();String title=type.equals("expenses")?"هزینه‌ها":type.equals("incomes")?"درآمدها":"چک و بدهی";
        header(archived?"آرشیو داخلی":type.equals("expenses")?"مدیریت پرداخت‌ها":type.equals("incomes")?"مدیریت دریافتی‌ها":"تعهدات و مطالبات",archived?"تاریخچه "+title:title,(archived?"موارد تکمیل‌شده":db.records(type,false).size()+" مورد ثبت‌شده"),!archived,v->showRecords(type,true));
        if(!archived)addFilters(type);else{Button back=button("بازگشت به فهرست فعال",BRAND,Color.rgb(228,244,239));back.setOnClickListener(v->showRecords(type,false));content.addView(back,margin(-1,dp(44),0,0,0,12));}
        List<FinanceDb.Record> rows=db.records(type,archived);if(rows.isEmpty()){content.addView(emptyView());return;}for(FinanceDb.Record r:rows)content.addView(recordCard(r,archived),margin(-1,-2,0,0,0,12));
    }

    private void addFilters(String type){HorizontalScrollView scroll=new HorizontalScrollView(this);scroll.setHorizontalScrollBarEnabled(false);LinearLayout filters=new LinearLayout(this);for(String s:new String[]{"همه","پرداخت شده","پرداخت نشده","عقب‌افتاده","نزدیک سررسید"})filters.addView(chip(s,s.equals("همه")?Color.WHITE:MUTED,s.equals("همه")?INK:Color.WHITE),margin(-2,dp(38),4,0,4,0));scroll.addView(filters);content.addView(scroll,margin(-1,dp(42),0,0,0,8));content.addView(text("مرتب‌سازی:  تاریخ سررسید⌄",10,MUTED,false),margin(-1,-2,0,0,0,10));}
    private View emptyView(){TextView e=centerText("✓\nموردی برای نمایش وجود ندارد",13,MUTED,true);e.setPadding(0,dp(45),0,dp(45));e.setBackground(round(Color.WHITE,18));return e;}

    private View recordCard(FinanceDb.Record r,boolean archived){
        LinearLayout card=column();card.setPadding(dp(16),dp(14),dp(16),dp(15));card.setBackground(round(Color.WHITE,19));card.setElevation(dp(5));card.setOnClickListener(v->showDetailSheet(r,archived));
        LinearLayout top=between();top.addView(chip(r.status,statusTextColor(r.status),statusBackground(r.status)));LinearLayout names=column();names.setGravity(Gravity.END);names.addView(text(r.category.isEmpty()?(r.isCheck?"چک":"بدون دسته‌بندی"):r.category,10,BRAND,true));names.addView(text(r.title,16,INK,true));top.addView(names);card.addView(top);
        card.addView(text(money(r.amount),21,INK,true),margin(-1,-2,0,10,0,4));card.addView(text("▣  سررسید "+jalali(r.dueDate)+(r.bank.isEmpty()?"":"   •   "+r.bank),10,MUTED,false));
        ProgressBar bar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);bar.setProgress(archived?100:70);bar.setProgressTintList(android.content.res.ColorStateList.valueOf(archived?GREEN:AMBER));card.addView(bar,margin(-1,dp(4),0,12,0,5));
        card.addView(text(archived?"این مورد در تاریخچه ذخیره شده است":r.type.equals("expenses")?"پرداخت بعدی "+jalali(r.dueDate):r.description.isEmpty()?"برای مشاهده جزئیات روی کارت بزنید":r.description,10,MUTED,false));
        Button action=button(archived?"بازگردانی":actionLabel(r),Color.WHITE,BRAND);if(archived)action.setTextColor(BRAND);if(archived)action.setBackground(round(Color.rgb(226,243,238),12));action.setOnClickListener(v->{if(archived){db.restore(r.id);showRecords(r.type,true);}else scheduleArchive(r);});card.addView(action,margin(-2,dp(44),0,12,0,0));return card;
    }

    private void showDetailSheet(FinanceDb.Record r,boolean archived){
        LinearLayout body=column();body.setPadding(dp(18),dp(10),dp(18),dp(22));LinearLayout actions=between();Button close=button("بستن",MUTED,Color.rgb(238,244,242));actions.addView(close);LinearLayout right=new LinearLayout(this);Button edit=button("ویرایش",BRAND,Color.rgb(226,243,238));Button del=button("حذف",RED,Color.rgb(255,235,233));right.addView(edit);right.addView(del);actions.addView(right);body.addView(actions,margin(-1,dp(44),0,0,0,12));
        LinearLayout hero=column();hero.setPadding(dp(15),dp(15),dp(15),dp(15));hero.setBackground(gradient(Color.rgb(229,244,239),Color.WHITE,17));hero.addView(text(r.isCheck?"چک":r.type.equals("checksAndDebts")?"بدهی":r.category,10,BRAND,true));hero.addView(text(r.title,18,INK,true));hero.addView(text(money(r.amount),23,BRAND,true));hero.addView(chip(r.status,statusTextColor(r.status),statusBackground(r.status)));body.addView(hero,margin(-1,-2,0,0,0,12));
        for(String line:new String[]{"تاریخ سررسید|"+jalali(r.dueDate),"دسته‌بندی|"+fallback(r.category),"نام فرد|"+fallback(r.person),"نوع رابطه مالی|"+fallback(r.relation),"نام بانک|"+fallback(r.bank),"توضیحات|"+fallback(r.description),"تاریخ ایجاد|"+r.createdAt}){String[] p=line.split("\\|",2);body.addView(detailRow(p[0],p[1]));}
        final Dialog dialog=bottomDialog(body);close.setOnClickListener(v->dialog.dismiss());edit.setOnClickListener(v->{dialog.dismiss();showRecordForm(r.type,r);});del.setOnClickListener(v->{db.delete(r.id);dialog.dismiss();showRecords(r.type,archived);});dialog.show();
    }

    private void showRecordForm(String type,FinanceDb.Record existing){
        LinearLayout body=column();body.setPadding(dp(18),dp(8),dp(18),dp(22));body.addView(text(existing==null?"افزودن رکورد":"ویرایش رکورد",18,INK,true),margin(-1,-2,0,0,0,12));
        EditText title=input("عنوان",existing==null?"":existing.title), amount=input("مبلغ",existing==null?"":String.valueOf(existing.amount)), person=input("نام فرد / مخاطب",existing==null?"":existing.person), category=input("دسته‌بندی",existing==null?"":existing.category), due=input("تاریخ سررسید",existing==null?"":existing.dueDate), desc=input("توضیحات",existing==null?"":existing.description), bank=input("نام بانک",existing==null?"":existing.bank);
        amount.setInputType(InputType.TYPE_CLASS_NUMBER);due.setFocusable(false);due.setOnClickListener(v->pickDate(due));Spinner relation=new Spinner(this);relation.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"پرداختنی","دریافتنی"}));if(existing!=null&&"دریافتنی".equals(existing.relation))relation.setSelection(1);
        body.addView(title);body.addView(amount);if(type.equals("checksAndDebts")){body.addView(person);body.addView(relation);body.addView(bank);}body.addView(category);body.addView(due);body.addView(desc);
        LinearLayout actions=new LinearLayout(this);Button cancel=button("لغو",MUTED,Color.rgb(235,241,239));Button save=button("ذخیره اطلاعات",Color.WHITE,BRAND);actions.addView(cancel,new LinearLayout.LayoutParams(0,dp(48),1));actions.addView(save,new LinearLayout.LayoutParams(0,dp(48),2));body.addView(actions,margin(-1,dp(48),0,14,0,0));Dialog dialog=bottomDialog(body);cancel.setOnClickListener(v->dialog.dismiss());save.setOnClickListener(v->{long value=parseLong(amount.getText().toString());String rel=type.equals("checksAndDebts")?relation.getSelectedItem().toString():"";if(existing==null)db.insertRecord(type,title.getText().toString(),person.getText().toString(),rel,value,due.getText().toString(),category.getText().toString(),desc.getText().toString(),false,bank.getText().toString());else db.updateRecord(existing.id,title.getText().toString(),person.getText().toString(),rel,value,due.getText().toString(),category.getText().toString(),desc.getText().toString(),existing.isCheck,bank.getText().toString());dialog.dismiss();showRecords(type,false);});dialog.show();
    }

    private void showSettings(){page="settings";buildNav();header("شخصی‌سازی و داده‌ها","تنظیمات","اطلاعات پایه و ذخیره‌سازی داخلی",false,null);for(String[] s:new String[][]{{"مخاطبین مالی","اطلاعات مخاطبان در دیتابیس داخلی"},{"مدیریت بانک‌ها","بانک شهر و بانک پاسارگاد"},{"مدیریت دسته‌بندی‌ها","دسته‌بندی هزینه و درآمد"},{"مدیریت تگ‌ها","تگ‌های مشترک رکوردها"},{"واحد پول","واحد فعلی: "+db.setting("currency","تومان")}}){LinearLayout row=between();row.setPadding(dp(14),dp(14),dp(14),dp(14));row.setBackground(round(Color.WHITE,15));row.setElevation(dp(2));LinearLayout labels=column();labels.addView(text(s[0],13,INK,true));labels.addView(text(s[1],10,MUTED,false));row.addView(labels);row.addView(text("‹",22,BRAND,true));content.addView(row,margin(-1,-2,0,0,0,10));}LinearLayout local=column();local.setPadding(dp(14),dp(14),dp(14),dp(14));local.setBackground(round(Color.rgb(237,245,242),16));local.addView(text("ذخیره‌سازی محلی و نیتیو",13,BRAND,true));local.addView(text("SQLite خصوصی اپ • بدون WebView • بدون اینترنت",10,MUTED,false));content.addView(local,margin(-1,-2,0,14,0,0));}

    private void scheduleArchive(FinanceDb.Record r){if(pendingAction!=null){handler.removeCallbacks(pendingAction);pendingAction.run();}pendingAction=()->{db.archive(r.id,finalStatus(r));pendingAction=null;hideUndo();showRecords(r.type,false);};handler.postDelayed(pendingAction,5000);showUndo();}
    private void showUndo(){hideUndo();LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(dp(13),dp(8),dp(13),dp(8));bar.setBackground(round(Color.rgb(24,59,52),15));bar.setElevation(dp(12));bar.addView(text("ثبت شد • انتقال به تاریخچه تا 5 ثانیه دیگر",10,Color.WHITE,true),new LinearLayout.LayoutParams(0,-2,1));Button undo=button("بازگشت",BRAND,Color.WHITE);undo.setOnClickListener(v->{handler.removeCallbacks(pendingAction);pendingAction=null;hideUndo();});bar.addView(undo);undoBar=bar;root.addView(bar,root.getChildCount()-1,margin(-1,dp(58),12,0,12,7));}
    private void hideUndo(){if(undoBar!=null){root.removeView(undoBar);undoBar=null;}}

    private Dialog bottomDialog(View view){Dialog d=new Dialog(this);d.setContentView(view);Window w=d.getWindow();if(w!=null){w.setBackgroundDrawable(round(BG,22));w.setLayout(-1,-2);w.setGravity(Gravity.BOTTOM);w.getAttributes().windowAnimations=android.R.style.Animation_Dialog;}d.setOnShowListener(x->{Window win=d.getWindow();if(win!=null)win.setLayout(-1,(int)(getResources().getDisplayMetrics().heightPixels*.88));});return d;}
    private View detailRow(String label,String value){LinearLayout row=column();row.setPadding(dp(11),dp(9),dp(11),dp(9));row.setBackground(round(Color.WHITE,12));row.addView(text(label,10,MUTED,false));row.addView(text(value,11,INK,true));row.setLayoutParams(margin(-1,-2,0,0,0,7));return row;}
    private void pickDate(EditText target){Calendar c=Calendar.getInstance();new DatePickerDialog(this,(v,y,m,d)->target.setText(String.format(Locale.US,"%04d-%02d-%02d",y,m+1,d)),c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show();}
    private String actionLabel(FinanceDb.Record r){return r.type.equals("expenses")?"پرداخت شد":r.type.equals("incomes")||"دریافتنی".equals(r.relation)?"دریافت شد":"تسویه شد";}
    private String finalStatus(FinanceDb.Record r){return r.type.equals("expenses")?"پرداخت شده":r.type.equals("incomes")||"دریافتنی".equals(r.relation)?"دریافت شده":"تسویه‌شده";}
    private String money(long value){String u=db.setting("currency","تومان");return NumberFormat.getNumberInstance(Locale.US).format(value)+" "+(u.equals("یورو")?"€":u.equals("دلار")?"$":u);}
    private String jalali(String iso){if(iso==null||iso.length()<10)return"بدون تاریخ";try{String[]p=iso.split("-");int gy=Integer.parseInt(p[0]),gm=Integer.parseInt(p[1]),gd=Integer.parseInt(p[2]);int[]j=toJalali(gy,gm,gd);return String.format(Locale.US,"%04d/%02d/%02d",j[0],j[1],j[2]);}catch(Exception e){return iso;}}
    private int[] toJalali(int gy,int gm,int gd){int[]gdm={0,31,59,90,120,151,181,212,243,273,304,334};int gy2=gm>2?gy+1:gy;int days=355666+365*gy+((gy2+3)/4)-((gy2+99)/100)+((gy2+399)/400)+gd+gdm[gm-1];int jy=-1595+33*(days/12053);days%=12053;jy+=4*(days/1461);days%=1461;if(days>365){jy+=(days-1)/365;days=(days-1)%365;}int jm=days<186?1+days/31:7+(days-186)/30;int jd=1+(days<186?days%31:(days-186)%30);return new int[]{jy,jm,jd};}
    private long parseLong(String s){try{return Long.parseLong(s.replace(",",""));}catch(Exception e){return 0;}}private String fallback(String s){return s==null||s.isEmpty()?"ثبت نشده":s;}
    private int statusTextColor(String s){return s.contains("عقب")||s.contains("برگشت")?RED:s.contains("شده")?GREEN:AMBER;}private int statusBackground(String s){return s.contains("عقب")||s.contains("برگشت")?Color.rgb(255,235,233):s.contains("شده")?Color.rgb(225,246,239):Color.rgb(255,242,217);}
    private int withAlpha(int c,int alpha){return Color.argb(alpha,Color.red(c),Color.green(c),Color.blue(c));}
    private LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}private LinearLayout between(){LinearLayout l=new LinearLayout(this);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    private TextView text(String s,float size,int color,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(color);t.setGravity(Gravity.START);t.setPadding(0,dp(2),0,dp(2));if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}private TextView centerText(String s,float z,int c,boolean b){TextView t=text(s,z,c,b);t.setGravity(Gravity.CENTER);return t;}
    private TextView chip(String s,int color,int bg){TextView t=centerText(s,10,color,true);t.setPadding(dp(10),dp(5),dp(10),dp(5));t.setBackground(round(bg,30));return t;}
    private Button button(String s,int color,int bg){Button b=new Button(this);b.setText(s);b.setTextColor(color);b.setTextSize(11);b.setAllCaps(false);b.setMinHeight(0);b.setMinimumHeight(0);b.setPadding(dp(12),dp(7),dp(12),dp(7));b.setBackground(round(bg,12));return b;}private Button iconButton(String s,int c,int bg){Button b=button(s,c,bg);b.setTextSize(20);return b;}
    private EditText input(String hint,String value){EditText e=new EditText(this);e.setHint(hint);e.setText(value);e.setTextSize(13);e.setTextColor(INK);e.setHintTextColor(MUTED);e.setPadding(dp(12),dp(11),dp(12),dp(11));e.setBackground(round(Color.WHITE,12));e.setLayoutParams(margin(-1,-2,0,0,0,9));return e;}
    private GradientDrawable round(int c,int r){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(r));return g;}private GradientDrawable gradient(int a,int b,int r){GradientDrawable g=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{a,b});g.setCornerRadius(dp(r));return g;}
    private LinearLayout.LayoutParams margin(int w,int h,int l,int t,int r,int b){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(w,h);p.setMargins(dp(l),dp(t),dp(r),dp(b));return p;}private int dp(int v){return(int)(v*getResources().getDisplayMetrics().density+.5f);}
}
