package com.timenow;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class TimeServlet extends HttpServlet{

    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException{

        response.setContentType("text/html");

        PrintWriter out=response.getWriter();

        out.println("Selaiyu, Tamil Nadu");
    }

}